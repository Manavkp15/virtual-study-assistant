import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePomodoro } from '../context/PomodoroContext';
import { Play, Pause, Maximize2, X, Sparkles, Coffee } from 'lucide-react';
import { tr } from '../utils/tr';

export const PomodoroMiniWidget: React.FC = () => {
  const { mode, status, timeLeft, pauseTimer, resumeTimer } = usePomodoro();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);

  // Do not show during break mode (full screen timer is active), on Pomodoro page, or when idle
  if (mode === 'break' || mode === 'long_break' || location.pathname === '/pomodoro' || location.pathname === '/pomodoro-timer' || status === 'idle' || isDismissed) {
    return null;
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isStudy = mode === 'study';

  return (
    <div className="fixed bottom-5 right-5 z-40 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div
        className={`flex items-center space-x-3 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl border transition-all ${
          isStudy
            ? 'bg-slate-900/95 border-blue-500/40 text-blue-400 shadow-blue-500/10'
            : 'bg-slate-900/95 border-emerald-500/40 text-emerald-400 shadow-emerald-500/10'
        }`}
      >
        {/* Pulsing mode icon */}
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/pomodoro')}>
          <div className="relative">
            {isStudy ? (
              <span className="text-base select-none">🍅</span>
            ) : (
              <Coffee className="w-4 h-4 text-emerald-400" />
            )}
            {status === 'running' && (
              <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${isStudy ? 'bg-blue-400' : 'bg-emerald-400'} animate-ping`} />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
              {isStudy ? tr('અભ્યાસ સત્ર', 'Study Focus', 'अध्ययन सत्र') : tr('વિરામ', 'Break', 'विराम')}
            </span>
            <span className="text-sm font-black font-mono tracking-tight text-white leading-tight">
              {formattedTime}
            </span>
          </div>
        </div>

        {/* Play/Pause control */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (status === 'running') {
              pauseTimer();
            } else {
              resumeTimer();
            }
          }}
          className={`p-1.5 rounded-xl transition-all cursor-pointer ${
            isStudy
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
          title={status === 'running' ? 'Pause' : 'Resume'}
        >
          {status === 'running' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        {/* Expand to full page */}
        <button
          onClick={() => navigate('/pomodoro')}
          className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
          title={tr('વિસ્તૃત કરો', 'Expand Timer', 'विस्तार करें')}
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {/* Dismiss mini-widget */}
        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800/60 transition-all cursor-pointer"
          title={tr('છુપાવો', 'Hide', 'छुपाएं')}
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
