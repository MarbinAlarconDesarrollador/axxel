const CACHE_NAME = 'nivel10-cache-v2';

// Aquí ponemos TODOS los archivos que queremos que se guarden sin conexión
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './img/heroe1.jpeg',
  './img/heroe2.jpeg',
  './img/heroe3.jpeg',
  './img/heroe4.jpeg',
  './img/heroe5.avif',
  './img/bb.jpeg',
  './img/estudio.jpeg',
  './img/jugando.jpeg',
  './img/tab.jpeg',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// INSTALACIÓN: Guarda los archivos en el teléfono
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Archivos guardados para uso sin conexión');
        return cache.addAll(urlsToCache);
      })
  );
});

// INTERCEPTOR: Cuando la app pide un archivo, lo busca primero en el teléfono
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si el archivo está guardado, lo devuelve al instante
        if (response) {
          return response;
        }
        // Si no está guardado, lo busca en internet
        return fetch(event.request);
      })
  );
});

// ACTUALIZACIÓN: Borra versiones viejas si cambiaste algo en el código
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});