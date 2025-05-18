// Service Worker for caching and push notifications
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

// Cache Name
const CACHE_NAME = 'story-app-v1';

// Application Shell - critical assets that make up the app shell
const appShellFiles = [
  '/',
  '/index.html',
  '/app.bundle.js',
  '/favicon.png',
  '/manifest.json',
  '/images/logo.png'
];

// Check if workbox is available
if (typeof workbox !== 'undefined') {
  console.log('Workbox is loaded');

  // Exclude hot update files from precaching to avoid conflicts with HMR
  workbox.routing.registerRoute(
    /.*\.hot-update\.json$/,
    new workbox.strategies.NetworkOnly()
  );

  // Exclude webpack-dev-server from caching to avoid HMR conflicts
  workbox.routing.registerRoute(
    /^http:\/\/localhost:\d+\/sockjs-node/,
    new workbox.strategies.NetworkOnly()
  );

  // Cache the app shell - the core assets needed to load the app
  workbox.precaching.precacheAndRoute(appShellFiles);

  // Cache CSS and JavaScript files
  workbox.routing.registerRoute(
    ({request}) => request.destination === 'style' || request.destination === 'script',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static-resources',
    })
  );

  // Cache images
  workbox.routing.registerRoute(
    ({request}) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'images',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        }),
      ],
    })
  );

  // Handle API requests with Network First strategy
  workbox.routing.registerRoute(
    new RegExp('https://story-api\\.dicoding\\.dev/v1/'),
    new workbox.strategies.NetworkFirst({
      cacheName: 'api-responses',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60, // 1 Day
        }),
      ],
    })
  );

  // Handle other routes with a Network First, falling back to cache
  workbox.routing.registerRoute(
    ({request}) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: 'pages',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 1 Day
        }),
      ],
    })
  );

} else {
  console.log('Workbox could not be loaded. Offline functionality will be limited.');
}

// Handle Push Notifications
self.addEventListener('push', function(event) {
  let data = {};
  if (event.data) {
    data = JSON.parse(event.data.text());
  }

  const title = data.title || 'New Story!';
  const options = {
    body: data.message || 'Someone shared a new story!',
    icon: '/images/logo.png',
    badge: '/favicon.png',
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