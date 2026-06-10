// sw.js - Service Worker для офлайн-работы cHeeSecaKe 1
const CACHE_NAME = 'cheesecake-v5';

// Установка Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW] Установка версии:', CACHE_NAME);
    self.skipWaiting();
});

// Активация — очищаем старые кэши
self.addEventListener('activate', (event) => {
    console.log('[SW] Активация версии:', CACHE_NAME);
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[SW] Удаление старого кэша:', key);
                    return caches.delete(key);
                }
            }));
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                // Если файл есть в кэше — возвращаем из кэша
                return cachedResponse;
            }
            // Если нет — пробуем загрузить из сети
            return fetch(event.request).then((networkResponse) => {
                // Сохраняем в кэш для следующих раз
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            }).catch(() => {
                // Если нет ни кэша, ни интернета — возвращаем заглушку
                if (event.request.mode === 'navigate') {
                    return caches.match('/');
                }
                return new Response('Ресурс недоступен офлайн', { status: 404 });
            });
        })
    );
});