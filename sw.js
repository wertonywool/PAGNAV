const CACHE_NAME = 'pagnav-v1';
const ASSETS = [
    './',
    './index.html',
    './login.html',
    './config.html',
    './manifest.json',
    './css/reset.css',
    './css/variables.css',
    './css/header.css',
    './css/grid.css',
    './css/cards.css',
    './css/actions.css',
    './css/modals.css',
    './css/buttons.css',
    './css/customizer.css',
    './css/login.css',
    './css/config.css',
    './js/app.js',
    './js/auth.js',
    './js/firebase-config.js',
    './js/store.js',
    './assets/icono de la app-64x64.png',
    './assets/icono de la app.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js'
];

// Instalar Service Worker y cachear recursos
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

// Activar y limpiar caches antiguos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
});

// Estrategia Stale-While-Revalidate
self.addEventListener('fetch', (event) => {
    // No cachear peticiones a Firebase (Firestore maneja su propia persistencia)
    if (event.request.url.includes('firestore.googleapis.com') || event.request.url.includes('firebase')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                });
                return networkResponse;
            });
            return cachedResponse || fetchPromise;
        })
    );
});
