import { useState, useEffect, useRef, useCallback } from 'react';

interface MeditationTimerOptions {
  onComplete?: () => void;
  onTick?: (remainingTime: number) => void;
  soundEnabled?: boolean;
  notificationEnabled?: boolean;
}

export const useMeditationTimer = (initialDuration: number, options: MeditationTimerOptions = {}) => {
  const {
    onComplete,
    onTick,
    soundEnabled = true,
    notificationEnabled = true
  } = options;

  const [isRunning, setIsRunning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(initialDuration);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [worker, setWorker] = useState<Worker | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const timerIdRef = useRef<string>(`timer-${Date.now()}`);

  // Initialize service worker
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker.register('/meditation-worker.js')
        .then(registration => {
          console.log('ServiceWorker registration successful');
          
          // Create a message channel for communication
          const worker = new Worker(new URL('../workers/meditation-timer.worker.ts', import.meta.url));
          setWorker(worker);

          // Handle messages from the worker
          worker.onmessage = (event) => {
            if (event.data.type === 'TICK') {
              const timeLeft = Math.max(0, event.data.remainingTime);
              setRemainingTime(timeLeft);
              onTick?.(timeLeft);
            } else if (event.data.type === 'COMPLETE') {
              handleTimerComplete();
            }
          };

          return registration.update();
        })
        .catch(error => {
          console.error('ServiceWorker registration failed:', error);
        });
    }

    // Cleanup
    return () => {
      worker?.terminate();
    };
  }, []);

  // Play alarm sound
  const playAlarm = useCallback(async () => {
    if (!soundEnabled) return;

    try {
      // Initialize audio context on user interaction
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Create a simple beep sound
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioContextRef.current.currentTime);
      
      gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, audioContextRef.current.currentTime + 0.1);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.start();
      
      // Stop after 3 seconds
      setTimeout(() => {
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current!.currentTime + 1);
        oscillator.stop(audioContextRef.current!.currentTime + 1);
      }, 3000);
      
    } catch (error) {
      console.error('Error playing alarm sound:', error);
    }
  }, [soundEnabled]);

  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    setRemainingTime(0);
    
    // Play sound if enabled
    if (soundEnabled) {
      playAlarm();
    }
    
    // Show notification if enabled and permission is granted
    if (notificationEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Meditation Complete', {
        body: 'Your meditation session has ended.',
        icon: '/icon-192x192.png'
      });
    }
    
    // Call the completion callback
    onComplete?.();
  }, [soundEnabled, notificationEnabled, onComplete, playAlarm]);

  // Start the timer
  const startTimer = useCallback(() => {
    if (isRunning) return;
    
    setIsRunning(true);
    setIsPaused(false);
    
    const endTime = Date.now() + remainingTime * 1000;
    setEndTime(endTime);
    
    // Start the timer in the worker
    worker?.postMessage({
      type: 'START',
      duration: remainingTime * 1000,
      timerId: timerIdRef.current
    });
  }, [isRunning, remainingTime, worker]);

  // Pause the timer
  const pauseTimer = useCallback(() => {
    if (!isRunning) return;
    
    setIsRunning(false);
    setIsPaused(true);
    
    // Pause the timer in the worker
    worker?.postMessage({
      type: 'PAUSE',
      timerId: timerIdRef.current
    });
  }, [isRunning, worker]);

  // Reset the timer
  const resetTimer = useCallback((newDuration?: number) => {
    const duration = newDuration !== undefined ? newDuration : initialDuration;
    
    setIsRunning(false);
    setIsPaused(false);
    setRemainingTime(duration);
    setEndTime(null);
    
    // Reset the timer in the worker
    worker?.postMessage({
      type: 'RESET',
      timerId: timerIdRef.current,
      duration: duration * 1000
    });
  }, [initialDuration, worker]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (worker) {
        worker.postMessage({
          type: 'CANCEL',
          timerId: timerIdRef.current
        });
      }
    };
  }, [worker]);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  // Format time as MM:SS
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    isRunning,
    isPaused,
    remainingTime,
    formattedTime: formatTime(remainingTime),
    start: startTimer,
    pause: pauseTimer,
    reset: resetTimer,
    setDuration: (seconds: number) => {
      if (!isRunning) {
        setRemainingTime(seconds);
      }
    },
    requestNotificationPermission
  };
};
