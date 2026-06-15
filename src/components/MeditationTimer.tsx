import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Bell } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useMeditationTimerContext } from '@/contexts/MeditationTimerContext';

const MeditationTimer: React.FC = () => {
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);

  const {
    isRunning,
    isPaused,
    remainingTime,
    formattedTime,
    duration,
    soundEnabled,
    notificationEnabled,
    start,
    pause,
    reset,
    setDuration,
    setTimerDuration,
    setSoundEnabled,
    setNotificationEnabled,
    requestNotificationPermission,
  } = useMeditationTimerContext();

  useEffect(() => {
    if (notificationEnabled && !hasRequestedPermission) {
      requestNotificationPermission().then(granted => {
        if (!granted) setNotificationEnabled(false);
        setHasRequestedPermission(true);
      });
    }
  }, [notificationEnabled, hasRequestedPermission, requestNotificationPermission, setNotificationEnabled]);

  const handleDurationChange = (value: number[]) => {
    setDuration(value[0]);
  };

  const handleStartPause = () => {
    if (isRunning) pause();
    else start();
  };

  const handleReset = () => {
    reset();
    setTimerDuration(duration);
  };

  const formatTimeInput = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-card rounded-lg shadow-lg p-6 max-w-md w-full mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Meditation Timer</h2>
        <p className="text-muted-foreground">
          {isRunning ? 'Meditation in progress...' : 'Set your meditation duration'}
        </p>
      </div>

      <div className="text-center mb-8">
        <div className="text-6xl font-mono font-bold text-primary mb-4">
          {formatTimeInput(remainingTime)}
        </div>
      </div>

      {!isRunning && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Duration: {Math.floor(duration / 60)} min</span>
            <span>{formatTimeInput(duration)}</span>
          </div>
          <Slider
            value={[duration]}
            onValueChange={handleDurationChange}
            min={60}
            max={3600}
            step={60}
            disabled={isRunning}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>1 min</span>
            <span>60 min</span>
          </div>
        </div>
      )}

      <div className="flex justify-center space-x-4 mb-6">
        <Button onClick={handleStartPause} size="lg" className="px-8 py-6 text-lg font-semibold">
          {isRunning ? (
            <><Pause className="mr-2 h-5 w-5" />Pause</>
          ) : (
            <><Play className="mr-2 h-5 w-5" />{isPaused ? 'Resume' : 'Start'}</>
          )}
        </Button>
        {(isRunning || isPaused) && (
          <Button variant="outline" onClick={handleReset} size="lg" className="px-8 py-6 text-lg">
            <RotateCcw className="mr-2 h-5 w-5" />Reset
          </Button>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <button
          onClick={() => setShowNotificationSettings(!showNotificationSettings)}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="mr-2">Notification Settings</span>
          {showNotificationSettings ? '▲' : '▼'}
        </button>

        {showNotificationSettings && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Bell className="h-5 w-5 mr-2 text-muted-foreground" />
                <span className="text-sm">Enable notifications</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationEnabled}
                  onChange={async () => {
                    if (!notificationEnabled) {
                      const granted = await requestNotificationPermission();
                      if (!granted) return;
                    }
                    setNotificationEnabled(!notificationEnabled);
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Bell className="h-5 w-5 mr-2 text-muted-foreground" />
                <span className="text-sm">Enable sound</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={() => setSoundEnabled(!soundEnabled)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeditationTimer;
