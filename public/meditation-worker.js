// Service Worker for background meditation timer
self.addEventListener('message', (event) => {
  if (event.data.type === 'START_TIMER') {
    const { duration, timerId } = event.data;
    
    // Start the timer
    const timer = setTimeout(() => {
      // Post message back to the client when timer completes
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'TIMER_COMPLETE',
            timerId,
            timestamp: Date.now()
          });
        });
      });
      
      // Show notification if permission is granted
      self.registration.showNotification('Meditation Complete', {
        body: 'Your meditation session has ended.',
        icon: '/icon-192x192.png',
        vibrate: [200, 100, 200]
      });
      
    }, duration);
    
    // Store the timer ID so we can cancel it if needed
    self.activeTimers = self.activeTimers || {};
    self.activeTimers[timerId] = timer;
    
  } else if (event.data.type === 'CANCEL_TIMER' && self.activeTimers) {
    // Cancel an active timer
    const { timerId } = event.data;
    if (self.activeTimers[timerId]) {
      clearTimeout(self.activeTimers[timerId]);
      delete self.activeTimers[timerId];
    }
  }
});

// Handle notification click
event.waitUntil(
  self.registration.showNotification('Meditation Complete', {
    body: 'Your meditation session has ended.',
    icon: '/icon-192x192.png',
    vibrate: [200, 100, 200]
  })
);
