import React from 'react';
import { useMeditationTimerContext } from '@/contexts/MeditationTimerContext';
import { Pause, Play, X } from 'lucide-react';

const GlobalMeditationIndicator: React.FC = () => {
  const { isRunning, isPaused, formattedTime, start, pause, reset } = useMeditationTimerContext();

  if (!isRunning && !isPaused) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-primary-foreground shadow-lg animate-in slide-in-from-bottom-4">
      <span className="text-sm font-mono font-bold">{formattedTime}</span>
      <button
        onClick={isRunning ? pause : start}
        className="p-1 rounded-full hover:bg-primary-foreground/20 transition-colors"
        aria-label={isRunning ? 'Pause' : 'Resume'}
      >
        {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
      <button
        onClick={() => reset()}
        className="p-1 rounded-full hover:bg-primary-foreground/20 transition-colors"
        aria-label="Stop"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default GlobalMeditationIndicator;
