/* Service Worker de Dahia App
   Objetivo: que la app se ACTUALICE SOLA al recargar o al cerrar y abrir,
   SIN tener que desinstalarla.

   Cómo se logra sin romper el login (ver skill Solucion_Ingreso):
   - Navegación = NETWORK-FIRST → al recargar/reabrir SIEMPRE trae el HTML
     fresco (y con él los assets nuevos, que llevan hash en el nombre).
   - Assets = stale-while-revalidate → cargan rápido desde caché y se
     refrescan en segundo plano.
   - Caché VERSIONADA → al activar una versión nueva, borra las viejas.
   - SIN self.skipWaiting() y SIN clients.claim(): nunca secuestra una
     sesión abierta (eso era lo que causaba el bucle de login en iOS).
     La versión nueva del SW queda lista y entra al cerrar/reabrir la app.
   - Nunca toca peticiones de Firebase/Google: van directo a la red. */

const VERSION = 'v2'
const CACHE = `dahia-pwa-${VERSION}`
const PRECACHE = ['/', '/index.html', '/manifest.json', '/icon-192.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).catch(() => {}))
  // NO self.skipWaiting()  ← a propósito (seguridad del login)
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  )
  // NO clients.claim()  ← a propósito
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return // Firebase/Google → directo a la red

  // HTML / navegación: red primero (fresco), respaldo a caché si está offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone()
          caches.open(CACHE).then((c) => c.put('/index.html', clone)).catch(() => {})
          return res
        })
        .catch(() => caches.match(request).then((c) => c || caches.match('/index.html'))),
    )
    return
  }

  // Assets propios (js/css/img/fuentes): stale-while-revalidate.
  if (['script', 'style', 'image', 'font'].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((res) => {
            const clone = res.clone()
            caches.open(CACHE).then((c) => c.put(request, clone)).catch(() => {})
            return res
          })
          .catch(() => cached)
        return cached || network
      }),
    )
  }
})

// Permite que la página pida activar la versión nueva sin esperar (opcional).
self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting()
})
