const CACHE = 'axxel-10-v1';

const CORE = [
  './', './index.html', './manifest.json',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png',
  './audio/pop.mp3', './audio/axxel_jhael.mp3', './img/heroe.jpg'
];

const FOTOS = [
  'axxelbb1-primeros-meses-jugando', 'axxelbb1gateando', 'axxelbb1sonrisa', 'axxelbb2hermoso',
  'axxelbb3primerospasos', 'axxelbb4comiendo', 'axxelbb5-1-10meses', 'axxelbb5-10meses',
  'axxelbb6-mi-principe-y-mi-princesa', 'axxelbb6mi-pequenio-thor', 'axxelbb7-11meses',
  'axxelbb8-explorandoelmundo', 'axxelbb9-con-papi', 'axxelbb10-desayuno-sorpresa',
  'axxelbb11-comiendo-algodon-de-azucar', 'axxelbb11-te-amo', 'axxelbb12-me-queria-asustar',
  'axxelbb12-te-amo', 'axxelbb13-estudiso', 'axxelbb14uyyy-miedo-jejej',
  'axxelbb15-mi-spider-su-hermanita-mujer-maravilla', 'axxelbb15-mi-spiderman-y-papa',
  'axxelbb16sonrisa-autentica', 'axxelbb17-comiendo-helado-con-papi',
  'axxelbb18-compartiendo-con-papi-y-hermana1', 'axxelbb18-compartiendo-con-papi-y-hermana-2',
  'axxelbb18-compartiendo-con-papi-y-hermana-3', 'axxelbb18-compartiendo-con-papi-y-hermana-4',
  'axxelbb19comiendo-helado-le-encanta', 'axxelbb20aprendiendo-monopatin', 'axxelbb20paseito',
  'axxelbb21-comiendo-mas-helado', 'axxelbb22amo-tus-locuras', 'axxelbb22amo-tus-locuras-1',
  'axxelbb23-el-feliz-con-su-super-helado', 'axxelbb24-como-has-crecido',
  'axxelbb26-nunca-dejes-de-reir', 'axxelbb26-te-estas-creciendo', 'axxel-y-papa'
].map(n => `./img/${n}.jpeg`);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Una a una: si falta algún archivo (p. ej. heroe.jpg), el resto igual se guarda.
    await Promise.allSettled([...CORE, ...FOTOS].map(url => cache.add(url)));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Safari/iOS pide el audio por rangos (Range); hay que responder 206 desde la caché.
async function rangeResponse(request, cached) {
  const buf = await cached.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(request.headers.get('range') || '');
  const start = m && m[1] ? parseInt(m[1], 10) : 0;
  const end = m && m[2] ? parseInt(m[2], 10) : buf.byteLength - 1;
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': cached.headers.get('Content-Type') || 'audio/mpeg',
      'Content-Range': `bytes ${start}-${end}/${buf.byteLength}`,
      'Content-Length': String(end - start + 1)
    }
  });
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: true });

    if (req.headers.has('range')) {
      if (cached) return rangeResponse(req, cached);
      return fetch(req);
    }

    // Páginas: red primero (para recibir cambios), caché si no hay internet.
    if (req.mode === 'navigate') {
      try {
        const fresh = await fetch(req);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (e) {
        return (await cache.match('./index.html')) || Response.error();
      }
    }

    // Recursos: caché primero, y se actualiza en segundo plano.
    if (cached) {
      fetch(req).then(r => { if (r && r.ok) cache.put(req, r.clone()); }).catch(() => {});
      return cached;
    }
    try {
      const res = await fetch(req);
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    } catch (e) {
      return Response.error();
    }
  })());
});
