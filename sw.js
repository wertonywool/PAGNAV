const CACHE_NAME = 'pagnav-v7';
const ASSETS = [
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

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

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

self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // Solo manejar esquemas http y https
    if (!url.protocol.startsWith('http')) return;

    // Ignorar Firebase/Analytics
    if (url.hostname.includes('firestore') || url.hostname.includes('firebase') || url.hostname.includes('google')) {
        return;
    }

    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            const networkFetch = fetch(request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
                }
                return networkResponse;
            }).catch(() => {
                // Silenciar errores de red
                return null;
            });

            // Retornar cache si existe, si no esperar a red, y si red falla devolver un error vacío pero válido
            return cachedResponse || networkFetch || new Response('Offline', { status: 503 });
        }).catch(() => {
            return new Response('Offline', { status: 503 });
        })
    );
});
