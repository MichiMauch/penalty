// Service Worker for Push Notifications
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  if (!event.data) {
    console.log('Push notification with no data');
    return;
  }

  try {
    const data = event.data.json();
    const { title, body, icon, badge, url, tag } = data;

    const options = {
      body: body || 'Du hast eine neue Nachricht',
      icon: icon || '/icon-192x192.png',
      badge: badge || '/icon-72x72.png',
      vibrate: [200, 100, 200],
      tag: tag || 'fussballpause-notification',
      requireInteraction: true,
      data: {
        url: url || '/',
        timestamp: Date.now()
      },
      actions: [
        {
          action: 'open',
          title: '⚽ Spielen',
          icon: '/icon-72x72.png'
        },
        {
          action: 'close',
          title: '❌ Später',
          icon: '/icon-72x72.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(title || 'Fußballpause', options)
    );
  } catch (error) {
    console.error('Error parsing push data:', error);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/garderobe';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window/tab open
        for (const client of windowClients) {
          if (client.url.includes('fussballpause') && 'focus' in client) {
            return client.focus().then(client => client.navigate(urlToOpen));
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync for offline support (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-challenges') {
    console.log('Background sync for challenges');
    // Future: Sync pending challenges when back online
  }
});