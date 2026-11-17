import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { soundEffects } from '../utils/soundEffects';
import { screenWakeLockManager } from '../utils/screenWakeLock';

export type PomodoroMode = 'study' | 'break' | 'long_break';
export type PomodoroStatus = 'idle' | 'running' | 'paused';

export interface PomodoroSettings {
  studyDuration: number; // in seconds (default 25 * 60)
  breakDuration: number; // in seconds (default 5 * 60)
  longBreakDuration: number; // in seconds (default 15 * 60)
  cyclesBeforeLongBreak: number; // default 4
  autoStartBreaks: boolean; // default true
  autoStartStudy: boolean; // default false
  soundEnabled: boolean; // default true
  keepScreenAwake: boolean; // default true (prevents laptop screen from sleeping/turning off while timer runs)
}

export interface PomodoroStats {
  completedSessionsToday: number;
  totalFocusMinutesToday: number;
  dateStr: string;
}

interface PomodoroContextType {
  mode: PomodoroMode;
  status: PomodoroStatus;
  timeLeft: number;
  totalTime: number;
  cycleCount: number;
  settings: PomodoroSettings;
  stats: PomodoroStats;
  currentSubject: string;
  lastCompletedMode: PomodoroMode | null;
  notificationMessage: string | null;
  isScreenAwake: boolean;
  setCurrentSubject: (subj: string) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  skipToNext: () => void;
  setMode: (mode: PomodoroMode) => void;
  updateSettings: (newSettings: Partial<PomodoroSettings>) => void;
  clearNotification: () => void;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  studyDuration: 25 * 60,
  breakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  cyclesBeforeLongBreak: 4,
  autoStartBreaks: true,
  autoStartStudy: false,
  soundEnabled: true,
  keepScreenAwake: true
};

const getTodayKey = () => {
  const d = new Date();
  return `vsa_pomodoro_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const loadTodayStats = (): PomodoroStats => {
  try {
    const key = getTodayKey();
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {}
  return {
    completedSessionsToday: 0,
    totalFocusMinutesToday: 0,
    dateStr: getTodayKey()
  };
};

const saveTodayStats = (stats: PomodoroStats) => {
  try {
    localStorage.setItem(getTodayKey(), JSON.stringify(stats));
  } catch (e) {}
};

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

export const PomodoroProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<PomodoroSettings>(() => {
    try {
      const saved = localStorage.getItem('vsa_pomodoro_settings');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_SETTINGS;
  });

  const [mode, setModeState] = useState<PomodoroMode>('study');
  const [status, setStatus] = useState<PomodoroStatus>('idle');
  const [timeLeft, setTimeLeft] = useState<number>(settings.studyDuration);
  const [cycleCount, setCycleCount] = useState<number>(1);
  const [currentSubject, setCurrentSubject] = useState<string>('General Study');
  const [stats, setStats] = useState<PomodoroStats>(loadTodayStats);
  const [lastCompletedMode, setLastCompletedMode] = useState<PomodoroMode | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [isScreenAwake, setIsScreenAwake] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const originalTitleRef = useRef<string>('');

  // Subscribe to screen wake lock manager status
  useEffect(() => {
    return screenWakeLockManager.subscribe(active => {
      setIsScreenAwake(active);
    });
  }, []);

  // Keep screen awake (prevent laptop from sleeping or turning off screen) while timer is running
  useEffect(() => {
    const keepAwake = settings.keepScreenAwake ?? true;
    if (status === 'running' && keepAwake) {
      screenWakeLockManager.acquire().catch(() => {});
    } else {
      screenWakeLockManager.release().catch(() => {});
    }
  }, [status, settings.keepScreenAwake]);

  // Re-acquire screen wake lock when browser tab becomes visible again
  useEffect(() => {
    const handleVisibility = () => {
      const keepAwake = settings.keepScreenAwake ?? true;
      if (document.visibilityState === 'visible' && status === 'running' && keepAwake) {
        screenWakeLockManager.handleVisibilityChange();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [status, settings.keepScreenAwake]);

  // Clean up wake lock on unmount
  useEffect(() => {
    return () => {
      screenWakeLockManager.release().catch(() => {});
    };
  }, []);

  // Request browser Notification permission once
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    if (typeof document !== 'undefined') {
      originalTitleRef.current = document.title;
    }
  }, []);

  // Update localStorage when settings change
  const updateSettings = useCallback((newSettings: Partial<PomodoroSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('vsa_pomodoro_settings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getTotalDurationForMode = useCallback((targetMode: PomodoroMode): number => {
    if (targetMode === 'study') return settings.studyDuration;
    return settings.breakDuration; // strictly 5-minute break
  }, [settings.studyDuration, settings.breakDuration]);

  const sendBrowserNotification = useCallback((title: string, body: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/school-logo.png'
        });
      } catch (e) {}
    }
  }, []);

  const recordCompletedStudySession = useCallback(() => {
    setStats(prev => {
      const updated: PomodoroStats = {
        ...prev,
        completedSessionsToday: prev.completedSessionsToday + 1,
        totalFocusMinutesToday: prev.totalFocusMinutesToday + Math.round(settings.studyDuration / 60)
      };
      saveTodayStats(updated);
      return updated;
    });
  }, [settings.studyDuration]);

  // Handle transition when timer hits 0
  const handleTimerComplete = useCallback(() => {
    if (mode === 'study') {
      // 25-minute study session completed!
      recordCompletedStudySession();
      setLastCompletedMode('study');

      if (settings.soundEnabled) {
        soundEffects.playSessionCompleteChime();
      }

      sendBrowserNotification(
        '🎉 Study Session Completed!',
        'Your 25-minute study session ended! 5-minute break has started. Relax and recharge!'
      );

      setNotificationMessage('🎉 25-minute study session completed! 5-minute break has started.');

      // Standard Pomodoro Cycle: Always transition to the 5-minute break and auto-start it
      setModeState('break');
      setTimeLeft(settings.breakDuration); // 5 minutes (300 seconds)
      setStatus('running'); // Automatically start the 5-minute break
    } else {
      // 5-minute break completed!
      setLastCompletedMode('break');

      if (settings.soundEnabled) {
        soundEffects.playBreakCompleteChime();
      }

      sendBrowserNotification(
        '⏰ Break Ended!',
        'Your 5-minute break is complete! Ready to start your next 25-minute study session.'
      );

      setNotificationMessage('⏰ 5-minute break finished! Ready to begin your next 25-minute study session. Click Start to begin.');

      const nextCycle = cycleCount + 1;
      setCycleCount(nextCycle);
      setModeState('study');
      setTimeLeft(settings.studyDuration); // 25 minutes (1500 seconds)
      // Allow next study session to begin (waiting for student to click Start)
      setStatus(settings.autoStartStudy ? 'running' : 'idle');
    }
  }, [
    mode,
    cycleCount,
    settings.soundEnabled,
    settings.autoStartStudy,
    settings.studyDuration,
    settings.breakDuration,
    recordCompletedStudySession,
    sendBrowserNotification
  ]);

  // Main countdown tick effect
  useEffect(() => {
    if (status === 'running') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [status, handleTimerComplete]);

  // Browser document title live update
  useEffect(() => {
    if (status === 'running' || status === 'paused') {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      const modeLabel = mode === 'study' ? '🎯 Focus' : '☕ Break';
      const statusIcon = status === 'paused' ? '⏸️' : '';
      document.title = `${statusIcon}(${formatted}) ${modeLabel} | VM જ્ઞાનસેતુ`;
    } else {
      if (originalTitleRef.current) {
        document.title = originalTitleRef.current;
      }
    }
  }, [timeLeft, status, mode]);

  // Controls
  const startTimer = useCallback(() => {
    if (settings.soundEnabled) soundEffects.playClickFeedback();
    setStatus('running');
  }, [settings.soundEnabled]);

  const pauseTimer = useCallback(() => {
    if (settings.soundEnabled) soundEffects.playClickFeedback();
    setStatus('paused');
  }, [settings.soundEnabled]);

  const resumeTimer = useCallback(() => {
    if (settings.soundEnabled) soundEffects.playClickFeedback();
    setStatus('running');
  }, [settings.soundEnabled]);

  const resetTimer = useCallback(() => {
    if (settings.soundEnabled) soundEffects.playClickFeedback();
    if ((mode === 'break' || mode === 'long_break') && status === 'idle') {
      // If already idle at 5:00 in break mode, resetting returns to study mode
      setModeState('study');
      setTimeLeft(settings.studyDuration);
      setStatus('idle');
    } else {
      setStatus('idle');
      setTimeLeft(getTotalDurationForMode(mode));
    }
  }, [mode, status, getTotalDurationForMode, settings.soundEnabled, settings.studyDuration]);

  const setMode = useCallback((newMode: PomodoroMode) => {
    if (settings.soundEnabled) soundEffects.playClickFeedback();
    setStatus('idle');
    setModeState(newMode);
    setTimeLeft(getTotalDurationForMode(newMode));
  }, [getTotalDurationForMode, settings.soundEnabled]);

  const skipToNext = useCallback(() => {
    if (settings.soundEnabled) soundEffects.playClickFeedback();
    if (mode === 'study') {
      setModeState('break');
      setTimeLeft(settings.breakDuration);
      setStatus('running');
    } else {
      setModeState('study');
      setTimeLeft(settings.studyDuration);
      setStatus('idle');
    }
  }, [mode, settings.breakDuration, settings.studyDuration, settings.soundEnabled]);

  const clearNotification = useCallback(() => {
    setNotificationMessage(null);
  }, []);

  const totalTime = getTotalDurationForMode(mode);

  return (
    <PomodoroContext.Provider
      value={{
        mode,
        status,
        timeLeft,
        totalTime,
        cycleCount,
        settings,
        stats,
        currentSubject,
        lastCompletedMode,
        notificationMessage,
        isScreenAwake,
        setCurrentSubject,
        startTimer,
        pauseTimer,
        resumeTimer,
        resetTimer,
        skipToNext,
        setMode,
        updateSettings,
        clearNotification
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
};

export const usePomodoro = () => {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error('usePomodoro must be used within a PomodoroProvider');
  }
  return context;
};
