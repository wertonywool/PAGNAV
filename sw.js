const CACHE_NAME = 'pagnav-v3';
const STATIC_ASSETS = [
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

// Instalación: Cachear todo lo estático de inmediato
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
});

// Activación: Limpiar caches viejos y tomar control
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

// Estrategia de Carga Inteligente
self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // Ignorar peticiones de Firebase/Analytics (Firestore tiene su propia persistencia)
    if (url.includes('firestore.googleapis.com') || url.includes('firebase') || url.includes('google-analytics')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // 1. Si está en cache, devolverlo DE INMEDIATO (Velocidad extrema)
            if (cachedResponse) {
                // Opcional: Actualizar el cache en segundo plano (Stale-While-Revalidate)
                fetch(event.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
                    }
                }).catch(() => {}); 
                
                return cachedResponse;
            }

            // 2. Si no está en cache, ir a la red
            return fetch(event.request).then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
                return networkResponse;
            }).catch(() => {
                // Si todo falla (offline y no en cache), intentar devolver index.html como fallback
                if (event.request.mode === 'navigate') {
                    return caches.match('index.html');
                }
            });
        })
    );
});
