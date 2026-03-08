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
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Clean up interval
  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    endTimeRef.current = null;
  }, []);

  // Play alarm sound
  const playAlarm = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      // Resume if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') ctx.resume();

      // Play a pleasant 3-beep pattern
      [0, 0.4, 0.8].forEach(offset => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 528; // pleasant frequency
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0, ctx.currentTime + offset);
        gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + offset + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + offset + 0.35);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + 0.35);
      });
    } catch (e) {
      console.error('Error playing alarm:', e);
    }
  }, [soundEnabled]);

  // Handle timer completion
  const handleComplete = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    setIsPaused(false);
    setRemainingTime(0);

    if (soundEnabled) playAlarm();

    if (notificationEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Meditation Complete', {
        body: 'Your meditation session has ended. Great job! 🧘',
        icon: '/meditalk-icon.svg'
      });
    }

    onComplete?.();
  }, [soundEnabled, notificationEnabled, onComplete, playAlarm, clearTimer]);

  // Tick — uses wall-clock end time so it stays accurate even if tab throttled
  const tick = useCallback(() => {
    if (!endTimeRef.current) return;
    const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
    setRemainingTime(remaining);
    onTick?.(remaining);
    if (remaining <= 0) {
      handleComplete();
    }
  }, [onTick, handleComplete]);

  // Start
  const start = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    setIsPaused(false);
    endTimeRef.current = Date.now() + remainingTime * 1000;
    intervalRef.current = setInterval(tick, 500); // 500ms for better accuracy
  }, [isRunning, remainingTime, tick]);

  // Pause
  const pause = useCallback(() => {
    if (!isRunning) return;
    clearTimer();
    setIsRunning(false);
    setIsPaused(true);
    // remainingTime is already up to date from last tick
  }, [isRunning, clearTimer]);

  // Reset
  const reset = useCallback((newDuration?: number) => {
    clearTimer();
    setIsRunning(false);
    setIsPaused(false);
    setRemainingTime(newDuration ?? initialDuration);
  }, [initialDuration, clearTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { clearTimer(); };
  }, [clearTimer]);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    try {
      return (await Notification.requestPermission()) === 'granted';
    } catch { return false; }
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
    start,
    pause,
    reset,
    setDuration: (seconds: number) => {
      if (!isRunning) setRemainingTime(seconds);
    },
    requestNotificationPermission
  };
};
