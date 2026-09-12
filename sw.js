const CACHE_NAME = 'apibreak';

const urlsToCache = [
    './',
    './landingpage.html',
    './dashboard.html',
    './logs.html',
    './endpoints.html',
    './alert.html',
    './demo.html',
    './style.css',
    './logs.css',
    './endpoint.css',
    './alert.css',
    './demo.css',
    './landingpage.css',
    './dashScript.js',
    './logs.js',
    './endpoint.js',
    './alert.js',
    './demo.js',
    './apibreak.js',
    './manifest.json',
    './apibreak.jpeg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(urlsToCache).catch((err) => {
                console.log('Some files failed:', err);
            });
        })
    );
    self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});