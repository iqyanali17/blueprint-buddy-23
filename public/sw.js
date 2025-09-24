// MEDITALK Service Worker - Enhanced PWA Experience
const CACHE_NAME = 'meditalk-v1.0.0';
const urlsToCache = [
  '/',
  '/dashboard',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('MEDITALK: Cache opened');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch Event - Network First Strategy for Medical Data
self.addEventListener('fetch', event => {
  // Skip caching for Supabase API calls to ensure fresh medical data
  if (event.request.url.includes('supabase.co') || 
      event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // If network request succeeds, update cache
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request);
      })
  );
});

// Activate Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('MEDITALK: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});