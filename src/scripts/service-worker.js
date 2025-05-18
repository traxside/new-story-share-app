// Service Worker for caching and push notifications
import 'regenerator-runtime';

// Cache Name
const CACHE_NAME = 'story-app-v1';

// List of assets to cache for offline usage
const assetsToCache = [
  './',
  './index.html',
  './favicon.png',
  './manifest.json',
  './images/logo.png',
  'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js',
];

// Install Service Worker and cache resources
self.addEventListener('install', (event) => {
  console.log('Installing Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching app shell...');
      return cache.addAll(assetsToCache);
    })
  );
});

// Activate Service Worker and clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Activating Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
});

// Network first, falling back to cache strategy
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.startsWith('https://story-api.dicoding.dev')) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // API requests - Network first with cache fallback
  if (event.request.url.includes('/v1/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If the response is valid, clone it and store it in the cache
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // If the network fails, try to serve from cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // For non-API requests, cache first with network fallback
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response; // Return from cache if found
      }
      
      // Fetch from network if not in cache
      return fetch(event.request).then((networkResponse) => {
        // Cache the fetched response
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      });
    })
  );
});

// Handle Push Notifications
self.addEventListener('push', function(event) {
  let data = {};
  if (event.data) {
    data = JSON.parse(event.data.text());
  }

  const title = data.title || 'New Story!';
  const options = {
    body: data.message || 'Someone shared a new story!',
    icon: './favicon.png',
    badge: './favicon.png',
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle Notification Click
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  // Open the app and navigate to a specific page when notification is clicked
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});