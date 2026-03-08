// Service Worker for background meditation timer
const activeTimers = {};

self.addEventListener('message', (event) => {
  if (event.data.type === 'START_TIMER') {
    const { duration, timerId } = event.data;
    
    const timer = setTimeout(() => {
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'TIMER_COMPLETE',
            timerId,
            timestamp: Date.now()
          });
        });
      });
      
      self.registration.showNotification('Meditation Complete', {
        body: 'Your meditation session has ended.',
        icon: '/meditalk-icon.svg',
        vibrate: [200, 100, 200]
      });

      delete activeTimers[timerId];
    }, duration);
    
    activeTimers[timerId] = timer;
    
  } else if (event.data.type === 'CANCEL_TIMER') {
    const { timerId } = event.data;
    if (activeTimers[timerId]) {
      clearTimeout(activeTimers[timerId]);
      delete activeTimers[timerId];
    }
  }
});

// Handle notification click — focus the app window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      if (clients.length > 0) {
        clients[0].focus();
      } else {
        self.clients.openWindow('/dashboard');
      }
    })
  );
});
