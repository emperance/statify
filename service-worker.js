// Statify PWA Service Worker
const CACHE_NAME = 'statify-v9';
const STATIC_CACHE = 'statify-static-v9';
const DYNAMIC_CACHE = 'statify-dynamic-v9';

// Files to cache immediately on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/assets/css/style.css',
    '/assets/css/animations.css',
    '/assets/css/themes.css',
    '/assets/css/file-upload.css',
    '/assets/css/ai-insights.css',
    '/assets/css/ai-features.css',
    '/assets/css/voice.css',
    '/assets/css/ocr.css',
    '/assets/css/navigation.css',
    '/assets/css/wordle.css',
    '/assets/css/market-tracker.css',
    '/assets/js/theme-config.js',
    '/assets/js/theme-manager.js',
    '/assets/js/calculator.js',
    '/assets/js/charts.js',
    '/assets/js/ai-insights.js',
    '/assets/js/voice-input.js',
    '/assets/js/ocr-input.js',
    '/assets/js/pdf-processor.js',
    '/assets/js/ai-data-extractor.js',
    '/assets/js/nl-query-handler.js',
    '/assets/js/navigation.js',
    '/assets/js/wordle.js',
    '/assets/js/market-tracker.js',
    '/assets/js/app.js',
    '/manifest.json'
];

// External CDN resources (cache on use)
const CDN_RESOURCES = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://cdn.jsdelivr.net'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[ServiceWorker] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[ServiceWorker] Install complete');
                return self.skipWaiting();
            })
            .catch((err) => {
                console.error('[ServiceWorker] Install failed:', err);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activating...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
                        .map((name) => {
                            console.log('[ServiceWorker] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[ServiceWorker] Activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Handle API requests (network first, with timeout)
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Handle CDN resources (cache first, then network)
    if (CDN_RESOURCES.some(cdn => request.url.startsWith(cdn))) {
        event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
        return;
    }

    // Handle static assets (cache first)
    event.respondWith(cacheFirst(request, STATIC_CACHE));
});

// Cache-first strategy
async function cacheFirst(request, cacheName) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.error('[ServiceWorker] Fetch failed:', error);
        // Return offline fallback for HTML pages
        if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
        }
        throw error;
    }
}

// Network-first strategy (for API calls)
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        return networkResponse;
    } catch (error) {
        console.log('[ServiceWorker] Network failed, checking cache');
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
