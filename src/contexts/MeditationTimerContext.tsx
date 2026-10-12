import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useMeditationTimer } from '@/hooks/useMeditationTimer';
import { useToast } from '@/hooks/use-toast';

interface MeditationTimerContextType {
  isRunning: boolean;
  isPaused: boolean;
  remainingTime: number;
  formattedTime: string;
  duration: number;
  soundEnabled: boolean;
  notificationEnabled: boolean;
  start: () => void;
  pause: () => void;
  reset: (newDuration?: number) => void;
  setDuration: (seconds: number) => void;
  setTimerDuration: (seconds: number) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setNotificationEnabled: (enabled: boolean) => void;
  requestNotificationPermission: () => Promise<boolean>;
}

const MeditationTimerContext = createContext<MeditationTimerContextType | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useMeditationTimerContext = () => {
  const ctx = useContext(MeditationTimerContext);
  if (!ctx) throw new Error('useMeditationTimerContext must be used within MeditationTimerProvider');
  return ctx;
};

export const MeditationTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [duration, setDuration] = useState(300);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const { toast } = useToast();

  const timer = useMeditationTimer(duration, {
    soundEnabled,
    notificationEnabled,
    onComplete: () => {
      toast({
        title: '🧘 Meditation Complete!',
        description: 'Your meditation session has ended. Great job!',
        duration: 10000,
      });
      document.title = 'MediTalk - Health Assistant';
    },
    onTick: (time) => {
      if (time > 0) {
        document.title = `(${Math.ceil(time / 60)}m) Meditation - MediTalk`;
      }
    },
  });

  const handleSetDuration = useCallback((seconds: number) => {
    setDuration(seconds);
    if (!timer.isRunning) {
      timer.setDuration(seconds);
    }
  }, [timer]);

  const contextValue = useMemo(() => ({
    ...timer,
    duration,
    soundEnabled,
    notificationEnabled,
    setDuration: handleSetDuration,
    setTimerDuration: timer.setDuration,
    setSoundEnabled,
    setNotificationEnabled,
  }), [timer, duration, soundEnabled, notificationEnabled, handleSetDuration]);

  return (
    <MeditationTimerContext.Provider value={contextValue}>
      {children}
    </MeditationTimerContext.Provider>
  );
};
