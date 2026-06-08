// sw.js - Service Worker для офлайн-работы cHeeSecaKe 1
const CACHE_NAME = 'cheesecake-v1';  // Меняйте версию при обновлении файлов

// Файлы, которые нужно кэшировать при установке
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/auth.html',
    '/lessons.html',
    '/profile.html',
    '/training.html',
    '/letters.html',
    '/about.html',
    '/lesson1.html',
    '/lesson2.html',
    '/lesson3.html',
    '/style.css',
    '/script.js',
    '/images/logo.png',
    '/images/numbers-cake.png',
    '/images/hello-cake.png',
    '/images/training-cake.png',
    '/images/learn-pinyin.png',
    '/images/old-cake.png',
    '/images/color-cakes.png',
    '/images/cake-cat.png',
    'https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW] Установка версии:', CACHE_NAME);
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Кэширование файлов');
            return cache.addAll(FILES_TO_CACHE);
        }).catch((err) => {
            console.error('[SW] Ошибка кэширования:', err);
        })
    );
    // Пропускаем фазу ожидания, активируем нового рабочего сразу
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
            // Забираем контроль над всеми открытыми вкладками
            return self.clients.claim();
        })
    );
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Для аудиофайлов — стратегия "кэш или сеть"
    if (url.pathname.startsWith('/audio/')) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request).then((networkResponse) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                }).catch(() => {
                    return new Response('Аудио недоступно офлайн', { status: 404 });
                });
            })
        );
        return;
    }
    
    // Для HTML, CSS, JS, изображений
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    if (event.request.mode === 'navigate') {
                        return caches.match('/');
                    }
                    return new Response('Ресурс недоступен офлайн', { status: 404 });
                });
            })
    );
});

// Сообщение от клиента о пропуске ожидания
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});