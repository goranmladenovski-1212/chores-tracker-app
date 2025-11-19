// Simple Service Worker for PWA
const CACHE_NAME = 'chores-tracker-v2';

self.addEventListener('install', (event) => {
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response
        const responseToCache = response.clone();
        
        // Cache successful responses
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        
        return response;
      })
      .catch(() => {
        // If fetch fails, try to get from cache
        return caches.match(event.request);
      })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Focus or open the app when notification is clicked
  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    }).then((clientList) => {
      // If app is already open, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        const url = new URL(client.url);
        const origin = self.location.origin;
        if (url.origin === origin && 'focus' in client) {
          return client.focus();
        }
      }
      // If app is not open, open it
      if (clients.openWindow) {
        return clients.openWindow(self.location.origin);
      }
    })
  );
});

// Handle push notifications (for future use with Push API)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const title = data.title || 'New Notification';
    const options = {
      body: data.body || '',
      icon: '/chores-tracker-app/icon.svg',
      badge: '/chores-tracker-app/icon.svg',
      vibrate: [200, 100, 200],
      tag: data.tag || 'default',
      requireInteraction: false,
      ...data.options,
    };
    
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});

