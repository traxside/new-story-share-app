// Service Worker for caching and push notifications
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

// Cache Name
const CACHE_NAME = 'story-app-v1';

// Use Workbox for better caching strategies
if (workbox) {
  console.log('Workbox is loaded');

  // This line is crucial - it's the placeholder that Workbox will replace with the precache manifest
  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);

  // App Shell architecture - core assets are precached for offline access
  workbox.routing.registerRoute(
    ({ url }) => url.origin === self.location.origin &&
      (url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname === ''),
    new workbox.strategies.NetworkFirst({
      cacheName: 'app-shell',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 10,
          maxAgeSeconds: 24 * 60 * 60 // 1 day
        })
      ]
    })
  );

  // Cache CSS and JavaScript files with a Stale-While-Revalidate strategy
  workbox.routing.registerRoute(
    ({request}) => request.destination === 'style' || request.destination === 'script',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static-resources',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 30,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 Days
        }),
      ],
    })
  );

  // Cache images with a Cache-First strategy
  workbox.routing.registerRoute(
    ({request}) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'images',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200]
        }),
      ],
    })
  );

  // Handle API requests with Network-First strategy
  workbox.routing.registerRoute(
    new RegExp('https://story-api\\.dicoding\\.dev/v1/'),
    new workbox.strategies.NetworkFirst({
      cacheName: 'api-responses',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60, // 1 Day
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200]
        }),
      ],
    })
  );

  // Default handler for navigation requests
  workbox.routing.setDefaultHandler(
    new workbox.strategies.NetworkFirst({
      cacheName: 'default-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 1 Day
        }),
      ],
    })
  );

  // Provide a fallback for navigation requests that fail
  workbox.routing.setCatchHandler(async ({ event }) => {
    if (event.request.destination === 'document') {
      return caches.match('offline.html');
    }
    return Response.error();
  });

} else {
  console.log('Workbox could not be loaded. Offline functionality will be limited.');
}

// Handle Push Notifications
self.addEventListener('push', function(event) {
  let data = {};
  if (event.data) {
    try {
      data = JSON.parse(event.data.text());
    } catch (error) {
      console.error('Error parsing push notification data:', error);
    }
  }

  const title = data.title || 'New Story!';
  const options = {
    body: data.message || 'Someone shared a new story!',
    icon: '/images/logo.png',
    badge: '/favicon.png',
    data: {
      url: data.url || '/',
    },
    // Add more notification options for better UX
    vibrate: [100, 50, 100],
    actions: [
      {
        action: 'explore',
        title: 'View Story',
      },
      {
        action: 'close',
        title: 'Close',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle Notification Click
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  // Check if action button was clicked
  if (event.action === 'explore') {
    // Open the app and navigate to the story page
    if (event.notification.data && event.notification.data.url) {
      event.waitUntil(
        clients.openWindow(event.notification.data.url)
      );
    } else {
      event.waitUntil(
        clients.openWindow('/')
      );
    }
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action (notification was clicked but not an action button)
    if (event.notification.data && event.notification.data.url) {
      event.waitUntil(
        clients.openWindow(event.notification.data.url)
      );
    } else {
      event.waitUntil(
        clients.openWindow('/')
      );
    }
  }
});

// Handle background synchronization (future feature)
self.addEventListener('sync', function(event) {
  if (event.tag === 'post-story') {
    // Handle background sync for posting stories when online
    event.waitUntil(syncStories());
  }
});

// Function to sync stories in the background
async function syncStories() {
  try {
    // Implement background sync logic here
    console.log('Background sync executed');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}