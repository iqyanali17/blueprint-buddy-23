// Web Worker for background timer
interface TimerMessage {
  type: 'START' | 'PAUSE' | 'RESET' | 'CANCEL';
  duration?: number;
  timerId: string;
}

const activeTimers: Record<string, {
  endTime: number;
  remaining: number;
  intervalId?: number;
}> = {};

const startTimer = (timerId: string, duration: number) => {
  // Clear any existing timer with this ID
  if (activeTimers[timerId]) {
    clearInterval(activeTimers[timerId].intervalId);
  }

  const endTime = Date.now() + duration;
  
  // Store the timer
  activeTimers[timerId] = {
    endTime,
    remaining: duration
  };

  // Start the interval
  const intervalId = setInterval(() => {
    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((activeTimers[timerId].endTime - now) / 1000));
    
    // Update remaining time
    activeTimers[timerId].remaining = remaining;
    
    // Send tick message
    self.postMessage({
      type: 'TICK',
      timerId,
      remainingTime: remaining,
      isComplete: false
    });
    
    // Check if timer is complete
    if (remaining <= 0) {
      clearInterval(intervalId);
      self.postMessage({
        type: 'COMPLETE',
        timerId
      });
      delete activeTimers[timerId];
    }
  }, 1000) as unknown as number;

  activeTimers[timerId].intervalId = intervalId;
};

const pauseTimer = (timerId: string) => {
  if (!activeTimers[timerId]) return;
  
  clearInterval(activeTimers[timerId].intervalId);
  delete activeTimers[timerId].intervalId;
};

const resetTimer = (timerId: string, duration: number) => {
  if (activeTimers[timerId]) {
    clearInterval(activeTimers[timerId].intervalId);
    delete activeTimers[timerId];
  }
  
  if (duration > 0) {
    startTimer(timerId, duration);
  }
};

// Handle messages from the main thread
self.onmessage = (e: MessageEvent<TimerMessage>) => {
  const { type, timerId, duration = 0 } = e.data;
  
  switch (type) {
    case 'START':
      startTimer(timerId, duration);
      break;
      
    case 'PAUSE':
      pauseTimer(timerId);
      break;
      
    case 'RESET':
      resetTimer(timerId, duration);
      break;
      
    case 'CANCEL':
      if (activeTimers[timerId]) {
        clearInterval(activeTimers[timerId].intervalId);
        delete activeTimers[timerId];
      }
      break;
  }
};

// Export empty object to satisfy TypeScript
export {};
