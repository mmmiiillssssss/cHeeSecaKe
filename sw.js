// sw.js - Service Worker для офлайн-работы cHeeSecaKe 1
const CACHE_NAME = 'cheesecake-v3';

// ВСЕ файлы, которые нужно кэшировать сразу при установке
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/auth.html',
    '/lessons.html',
    '/profile.html',
    '/training.html',
    '/letters.html',
    '/about.html',
    // Уроки 1-30
    '/lesson1.html',
    '/lesson2.html',
    '/lesson3.html',
    '/lesson4.html',
    '/lesson5.html',
    '/lesson6.html',
    '/lesson7.html',
    '/lesson8.html',
    '/lesson9.html',
    '/lesson10.html',
    '/lesson11.html',
    '/lesson12.html',
    '/lesson13.html',
    '/lesson14.html',
    '/lesson15.html',
    '/lesson16.html',
    '/lesson17.html',
    '/lesson18.html',
    '/lesson19.html',
    '/lesson20.html',
    '/lesson21.html',
    '/lesson22.html',
    '/lesson23.html',
    '/lesson24.html',
    '/lesson25.html',
    '/lesson26.html',
    '/lesson27.html',
    '/lesson28.html',
    '/lesson29.html',
    '/lesson30.html',
    // Стили и скрипты
    '/style.css',
    '/script.js',
    // Изображения
    '/images/logo.png',
    '/images/numbers-cake.png',
    '/images/hello-cake.png',
    '/images/training-cake.png',
    '/images/learn-pinyin.png',
    '/images/old-cake.png',
    '/images/color-cakes.png',
    '/images/cake-cat.png',
    // ВСЕ АУДИОФАЙЛЫ (по вашей фотке)
    '/audio/ma0.mp3',
    '/audio/ma1.mp3',
    '/audio/ma2.mp3',
    '/audio/ma3.mp3',
    '/audio/ma4.mp3',
    '/audio/ba.mp3',
    '/audio/baba.mp3',
    '/audio/c.mp3',
    '/audio/d.mp3',
    '/audio/didi.mp3',
    '/audio/duibuqi.mp3',
    '/audio/e.mp3',
    '/audio/er.mp3',
    '/audio/erzi.mp3',
    '/audio/error.mp3',
    '/audio/f.mp3',
    '/audio/g.mp3',
    '/audio/gege.mp3',
    '/audio/h.mp3',
    '/audio/j.mp3',
    '/audio/jia.mp3',
    '/audio/jiejie.mp3',
    '/audio/jiu.mp3',
    '/audio/k.mp3',
    '/audio/l.mp3',
    '/audio/liu.mp3',
    '/audio/m.mp3',
    '/audio/ma.mp3',
    '/audio/mama.mp3',
    '/audio/meimei.mp3',
    '/audio/n.mp3',
    '/audio/nainai.mp3',
    '/audio/ni.mp3',
    '/audio/nidenuerjisuile.mp3',
    '/audio/nihaowojiaoanna.mp3',
    '/audio/nihao.mp3',
    '/audio/nimenjiayoujikouren.mp3',
    '/audio/nuer.mp3',
    '/audio/p.mp3',
    '/audio/qi.mp3',
    '/audio/r.mp3',
    '/audio/s.mp3',
    '/audio/san.mp3',
    '/audio/shi.mp3',
    '/audio/si.mp3',
    '/audio/success.mp3',
    '/audio/t.mp3',
    '/audio/ta.mp3',
    '/audio/w.mp3',
    '/audio/wo.mp3',
    '/audio/woaiwojiairen.mp3',
    '/audio/wojiaoanna.mp3',
    '/audio/wojiayousankouren.mp3',
    '/audio/woyouliangge.mp3',
    '/audio/woyousangepingguo.mp3',
    '/audio/woyouyige.mp3',
    '/audio/woyouyigegeheyigemeimei.mp3',
    '/audio/wu.mp3',
    '/audio/x.mp3',
    '/audio/xiexie.mp3',
    '/audio/y.mp3',
    '/audio/yeye.mp3',
    '/audio/yeyehenainai.mp3',
    '/audio/yi.mp3',
    '/audio/you.mp3',
    '/audio/z.mp3',
    '/audio/zaijian.mp3',
    '/audio/zhegeduoshaoqian.mp3',
    '/audio/zheshiwomama.mp3',
    // Внешние ресурсы
    'https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// Установка — кэшируем все файлы сразу
self.addEventListener('install', (event) => {
    console.log('[SW] Установка и кэширование всех файлов (включая аудио)...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(FILES_TO_CACHE);
        }).catch((err) => {
            console.error('[SW] Ошибка кэширования:', err);
        })
    );
    self.skipWaiting();
});

// Активация — очищаем старые кэши
self.addEventListener('activate', (event) => {
    console.log('[SW] Активация...');
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[SW] Удаление старого кэша:', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    self.clients.claim();
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request);
        }).catch(() => {
            return new Response('Ресурс недоступен офлайн', { status: 404 });
        })
    );
});