const CACHE_NAME = 'pagnav-v2';
const ASSETS = [
    'index.html',
    'login.html',
    'config.html',
    'manifest.json',
    'css/reset.css',
    'css/variables.css',
    'css/header.css',
    'css/grid.css',
    'css/cards.css',
    'css/actions.css',
    'css/modals.css',
    'css/buttons.css',
    'css/customizer.css',
    'css/login.css',
    'css/config.css',
    'js/app.js',
    'js/auth.js',
    'js/firebase-config.js',
    'js/store.js',
    'assets/icono de la app-64x64.png',
    'assets/icono de la app.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Usamos addAll pero con un catch por si algún archivo falla, 
            // no detenga la instalación de los demás si es crítico
            return cache.addAll(ASSETS).catch(err => {
                console.warn('Algunos activos no se pudieron cachear durante la instalación', err);
            });
        })
    );
});

// Activar y tomar control inmediatamente
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.keys().then((keys) => {
                return Promise.all(
                    keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
                );
            })
        ])
    );
});

// Estrategia Network First (con fallback a Cache) para archivos dinámicos
// o Cache First para activos estáticos.
self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // No interceptar peticiones a Firebase
    if (url.includes('firestore.googleapis.com') || url.includes('firebase')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request).then((networkResponse) => {
                // Solo cachear respuestas válidas
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }

                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;
            }).catch(() => {
                // Si falla el fetch y no hay cache, mostrar algo o fallar silenciosamente
                return null;
            });
        })
    );
});
