const CACHE_NAME = 'pagnav-v4';
const STATIC_ASSETS = [
    './',
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

// Instalación
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
});

// Activación
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

// Fetch con manejo de errores robusto
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 1. Filtrar solo peticiones HTTP/HTTPS (ignora chrome-extension, etc)
    if (!url.protocol.startsWith('http')) return;

    // 2. Ignorar Firebase y Analytics
    if (url.hostname.includes('firestore') || url.hostname.includes('firebase') || url.hostname.includes('google-analytics')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Estrategia: Cache First, pero actualizar en background si hay red
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch((err) => {
                // Si falla la red y NO hay cache, devolvemos un error controlado
                if (!cachedResponse) {
                    if (event.request.mode === 'navigate') {
                        return caches.match('index.html');
                    }
                    // Retornar una respuesta vacía válida para evitar el TypeError en la consola
                    return new Response('', { status: 408, statusText: 'Network Error' });
                }
            });

            return cachedResponse || fetchPromise;
        })
    );
});
