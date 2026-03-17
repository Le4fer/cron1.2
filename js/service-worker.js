const CACHE_NAME = 'cronosmind-v1';
const urlsToCache = [
    '/',
    '/dashboard.html',
    '/cronograma.html',
    '/journal.html',
    '/goals.html',
    '/css/style.css',
    '/css/components.css',
    '/css/cronograma.css',
    '/css/journal.css',
    '/css/goals.css',
    '/js/main.js',
    '/js/calendar.js',
    '/js/cronograma.js',
    '/js/journal.js',
    '/js/goals.js',
    '/js/ai-assistant.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// Instalar Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache abierto');
                return cache.addAll(urlsToCache);
            })
    );
});

// Interceptar peticiones
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Devolver del cache si existe
                if (response) {
                    return response;
                }
                
                // Sino, buscar en red
                return fetch(event.request).then(
                    response => {
                        // No cachear si no es válido
                        if(!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clonar respuesta
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    }
                );
            })
    );
});

// Limpiar caches antiguos
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