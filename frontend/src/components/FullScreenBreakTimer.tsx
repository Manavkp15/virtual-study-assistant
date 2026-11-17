import React from 'react';
import { usePomodoro } from '../context/PomodoroContext';
import { useTranslation } from 'react-i18next';
import { tr } from '../utils/tr';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Coffee,
  Eye
} from 'lucide-react';

export const FullScreenBreakTimer: React.FC = () => {
  const {
    mode,
    status,
    timeLeft,
    totalTime,
    settings,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    updateSettings
  } = usePomodoro();

  const { i18n } = useTranslation();

  // If not break mode, do not display this full screen takeover
  if (mode !== 'break' && mode !== 'long_break') {
    return null;
  }

  // Format time as MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');

  // Circular progress calculations
  const progressRatio = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;
  const radius = 145;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressRatio * circumference;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-8 select-none overflow-hidden animate-fadeIn">
      {/* Background Soft Calming Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />

      {/* Break Mode Card - Clean, distraction-free, showing ONLY timer and controls */}
      <div className="w-full max-w-xl flex flex-col items-center space-y-8 relative z-10">
        {/* Top Header: Clear Break Mode Indicator & Audio Toggle */}
        <div className="w-full flex items-center justify-between px-2">
          <div className="inline-flex items-center space-x-2.5 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/10">
            <Coffee className="w-4 h-4" />
            <span>{tr('વિરામ મોડ (૫ મિનિટ)', 'Break Mode (5 min)', 'विश्राम मोड (5 मिनट)')}</span>
          </div>

          <div className="flex items-center space-x-2">
            <div
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                status === 'running'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
              title={tr('ટાઈમર દરમિયાન સ્ક્રીન ઊંઘશે નહીં (Screen will stay awake)', 'Screen stays awake while timer runs', 'टाइमर चलने पर स्क्रीन बंद नहीं होगी')}
            >
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">{tr('સ્ક્રીન ચાલુ રહેશે', 'Screen Awake', 'स्क्रीन चालू रहेगी')}</span>
            </div>

            <button
              type="button"
              onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
              className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                settings.soundEnabled
                  ? 'bg-emerald-600/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/25'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title={settings.soundEnabled ? tr('અવાજ ચાલુ છે (મ્યૂટ કરો)', 'Audio Alert Enabled', 'ध्वनि सक्षम है') : tr('અવાજ બંધ છે (ચાલુ કરો)', 'Audio Muted', 'ध्वनि बंद है')}
            >
              {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Large Countdown Circular Timer */}
        <div className="relative flex items-center justify-center py-2">
          <svg className="w-72 h-72 sm:w-96 sm:h-96 -rotate-90 transform" viewBox="0 0 320 320">
            {/* Background Track */}
            <circle
              cx="160"
              cy="160"
              r={radius}
              className="stroke-slate-900"
              strokeWidth="14"
              fill="transparent"
            />
            {/* Emerald Animated Countdown Arc */}
            <circle
              cx="160"
              cy="160"
              r={radius}
              stroke="#10b981"
              strokeWidth="14"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-linear drop-shadow-[0_0_16px_rgba(16,185,129,0.4)]"
            />
          </svg>

          {/* Central Timer Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center space-x-1.5 mb-1.5">
              <Coffee className="w-3.5 h-3.5 text-emerald-400" />
              <span>{tr('વિશ્રામ અને તાજગી', 'Rest & Recharge', 'विश्राम और ताजगी')}</span>
            </span>

            {/* Giant Monospace 5-Minute Countdown */}
            <h1 className="text-7xl sm:text-8xl md:text-9xl font-black font-mono tracking-tight text-emerald-300 select-none drop-shadow-lg">
              {formattedMinutes}:{formattedSeconds}
            </h1>

            {/* Dynamic Status Subtitle */}
            <div className="mt-3 text-xs sm:text-sm font-medium text-emerald-300/90">
              {status === 'running' && (
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>{tr('વિરામ ચાલુ છે • આંખોને આરામ આપો', 'Break in progress • Rest your eyes & stretch', 'विश्राम जारी है • आँखों को आराम दें')}</span>
                </span>
              )}
              {status === 'paused' && (
                <span className="text-amber-400 font-semibold flex items-center space-x-1.5">
                  <span>⏸️</span>
                  <span>{tr('વિરામ થોભાવેલ છે', 'Break Paused', 'विराम रोका गया')}</span>
                </span>
              )}
              {status === 'idle' && (
                <span className="text-slate-400">
                  {tr('વિરામ શરૂ કરવા Start દબાવો', 'Click Start to begin break', 'विराम शुरू करने के लिए Start दबाएं')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Basic Timer Controls (Start, Pause, Resume, Reset, Skip to Study) */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 w-full max-w-md pt-2">
          {status === 'idle' ? (
            <div className="flex items-center space-x-3 w-full">
              <button
                type="button"
                onClick={startTimer}
                className="flex-1 py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base flex items-center justify-center space-x-2 shadow-xl shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>{tr('વિરામ શરૂ કરો', 'Start Break', 'विराम शुरू करें')}</span>
              </button>
              <button
                type="button"
                onClick={resetTimer}
                className="py-4 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 font-semibold text-sm flex items-center justify-center space-x-1.5 transition-all cursor-pointer active:scale-95"
                title={tr('અભ્યાસ પર પાછા જાઓ', 'Return to Study', 'अध्ययन पर वापस जाएं')}
              >
                <RotateCcw className="w-4 h-4" />
                <span>{tr('રીસેટ', 'Reset', 'रीसेट')}</span>
              </button>
            </div>
          ) : status === 'running' ? (
            <>
              <button
                type="button"
                onClick={pauseTimer}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm sm:text-base flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
              >
                <Pause className="w-5 h-5 fill-current" />
                <span>{tr('થોભો (Pause)', 'Pause', 'रोकें (Pause)')}</span>
              </button>
              <button
                type="button"
                onClick={resetTimer}
                className="py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-sm flex items-center justify-center space-x-1.5 transition-all cursor-pointer active:scale-95"
                title={tr('વિરામ રીસેટ કરો', 'Reset Break', 'विराम रीसेट करें')}
              >
                <RotateCcw className="w-4 h-4" />
                <span>{tr('રીસેટ', 'Reset', 'रीसेट')}</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={resumeTimer}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm sm:text-base flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>{tr('ફરી શરૂ કરો (Resume)', 'Resume', 'पुनः शुरू करें (Resume)')}</span>
              </button>
              <button
                type="button"
                onClick={resetTimer}
                className="py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-sm flex items-center justify-center space-x-1.5 transition-all cursor-pointer active:scale-95"
                title={tr('વિરામ રીસેટ કરો', 'Reset Break', 'विराम रीसेट करें')}
              >
                <RotateCcw className="w-4 h-4" />
                <span>{tr('રીસેટ', 'Reset', 'रीसेट')}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
