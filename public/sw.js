// Service worker mínimo: lo justo para que la PWA sea instalable.
// No cachea respuestas (la app necesita datos siempre frescos).
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {
  // Dejamos pasar todas las peticiones a la red (sin caché).
})
