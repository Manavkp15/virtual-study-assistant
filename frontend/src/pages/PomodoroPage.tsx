import React, { useEffect } from 'react';
import { usePomodoro } from '../context/PomodoroContext';
import { useTranslation } from 'react-i18next';
import { tr } from '../utils/tr';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Brain,
  Coffee,
  CheckCircle2,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';

export const PomodoroPage: React.FC = () => {
  const {
    mode,
    status,
    timeLeft,
    totalTime,
    settings,
    currentSubject,
    setCurrentSubject,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    setMode,
    updateSettings
  } = usePomodoro();

  const { i18n } = useTranslation();

  // Format time as MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');

  // Calculate circular progress (0 to 1)
  const progressRatio = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;
  const radius = 135;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressRatio * circumference;

  const isBreak = mode === 'break' || mode === 'long_break';

  const subjectOptions = [
    { id: 'Mathematics', en: 'Mathematics', gu: 'ગણિત', hi: 'गणित' },
    { id: 'Science', en: 'Science', gu: 'વિજ્ઞાન', hi: 'विज्ञान' },
    { id: 'English', en: 'English', gu: 'અંગ્રેજી', hi: 'अंग्रेज़ी' },
    { id: 'Social Science', en: 'Social Science', gu: 'સામાજિક વિજ્ઞાન', hi: 'सामाजिक विज्ञान' },
    { id: 'Gujarati', en: 'Gujarati', gu: 'ગુજરાતી', hi: 'गुजराती' },
    { id: 'Hindi', en: 'Hindi', gu: 'હિન્દી', hi: 'हिन्दी' },
    { id: 'General Study', en: 'General Study', gu: 'સામાન્ય અભ્યાસ', hi: 'सामान्य अध्ययन' }
  ];

  // If in break mode, FullScreenBreakTimer is rendered globally in ProtectedLayout with all navigation bars hidden
  if (isBreak) {
    return null;
  }

  /* ========================================================================= */
  /* STUDY MODE VIEW                                                           */
  /* 25-minute Focused Study Session with clean, modern, distraction-free UI.   */
  /* ========================================================================= */
  return (
    <div className="min-h-[calc(100vh-6rem)] flex flex-col items-center justify-center p-3 sm:p-6 transition-all duration-500 animate-fadeIn">
      <div className="w-full max-w-xl bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden flex flex-col items-center space-y-7">
        {/* Subtle Ambient Focus Glow */}
        <div className="absolute -top-32 -left-32 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none bg-blue-500" />
        <div className="absolute -bottom-32 -right-32 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none bg-indigo-500" />

        {/* Top Bar: Mode Indicator and Audio Mute Toggle */}
        <div className="w-full flex items-center justify-between relative z-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs sm:text-sm font-bold shadow-sm shadow-blue-500/10">
            <span className="text-sm">🍅</span>
            <span>{tr('અભ્યાસ મોડ (૨૫ મિનિટ)', 'Study Mode (25 min)', 'अध्ययन मोड (25 मिनट)')}</span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Screen Awake Toggle (Prevents laptop screen from sleeping) */}
            <button
              type="button"
              onClick={() => updateSettings({ keepScreenAwake: !settings.keepScreenAwake })}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                settings.keepScreenAwake
                  ? 'bg-blue-600/15 border-blue-500/30 text-blue-300 hover:bg-blue-600/25'
                  : 'bg-slate-800/80 border-slate-700 text-slate-500 hover:text-slate-300'
              }`}
              title={
                settings.keepScreenAwake
                  ? tr('સ્ક્રીન ઊંઘશે નહીં (Keep Awake On)', 'Screen stays awake while timer runs', 'स्क्रीन चालू रहेगी')
                  : tr('સ્ક્રીન ઊંઘી શકે છે (Keep Awake Off)', 'Normal display sleep allowed', 'सामान्य स्क्रीन टाइमआउट')
              }
            >
              {settings.keepScreenAwake ? (
                <Eye className="w-4 h-4 text-blue-400" />
              ) : (
                <EyeOff className="w-4 h-4 text-slate-500" />
              )}
              <span className="hidden sm:inline">
                {settings.keepScreenAwake
                  ? tr('સ્ક્રીન ચાલુ રહેશે', 'Screen Awake', 'स्क्रीन चालू रहेगी')
                  : tr('સ્લીપ સામાન્ય', 'Normal Sleep', 'सामान्य स्लीप')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                settings.soundEnabled
                  ? 'bg-blue-600/15 border-blue-500/30 text-blue-300 hover:bg-blue-600/25'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title={settings.soundEnabled ? tr('અવાજ ચાલુ છે (મ્યૂટ કરો)', 'Audio Alert Enabled', 'ध्वनि सक्षम है') : tr('અવાજ બંધ છે (ચાલુ કરો)', 'Audio Muted', 'ध्वनि बंद है')}
            >
              {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Optional Subject Pill Selector (compact, non-distracting) */}
        <div className="flex flex-col items-center space-y-1.5 relative z-10">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            {tr('વિષય પસંદ કરો', 'Current Subject', 'विषय चुनें')}
          </span>
          <div className="flex flex-wrap justify-center gap-1.5 max-w-md">
            {subjectOptions.map(subj => {
              const label = tr(subj.gu, subj.en, subj.hi);
              const isSelected = currentSubject === subj.id;
              return (
                <button
                  key={subj.id}
                  type="button"
                  onClick={() => setCurrentSubject(subj.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300 font-semibold shadow-sm shadow-blue-500/20'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Large Countdown Circular Progress Display */}
        <div className="relative flex items-center justify-center z-10">
          <svg className="w-64 h-64 sm:w-80 sm:h-80 -rotate-90 transform" viewBox="0 0 300 300">
            <circle
              cx="150"
              cy="150"
              r={radius}
              className="stroke-slate-800/80"
              strokeWidth="12"
              fill="transparent"
            />
            <circle
              cx="150"
              cy="150"
              r={radius}
              stroke="#3b82f6"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-linear drop-shadow-[0_0_12px_rgba(59,130,246,0.35)]"
            />
          </svg>

          {/* Inner Content Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center space-x-1.5 mb-1">
              <Brain className="w-3.5 h-3.5 text-blue-400" />
              <span>{tr('ઊંડી એકાગ્રતા સત્ર', 'Deep Study Focus', 'गहरी एकाग्रता सत्र')}</span>
            </span>

            {/* Big Monospace 25-Minute Countdown */}
            <h2 className="text-6xl sm:text-7xl font-black font-mono tracking-tight text-white select-none drop-shadow-md">
              {formattedMinutes}:{formattedSeconds}
            </h2>

            {/* Dynamic Status Subtitle */}
            <div className="mt-2 text-xs sm:text-sm font-medium">
              {status === 'running' && (
                <span className="flex items-center space-x-1.5 text-blue-400">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                  <span>{tr('અભ્યાસ ચાલુ છે • વિક્ષેપ ટાળો', 'Session in progress • Stay focused', 'सत्र जारी है • ध्यान केंद्रित रखें')}</span>
                </span>
              )}
              {status === 'paused' && (
                <span className="text-amber-400 font-semibold flex items-center space-x-1">
                  <span>⏸️</span>
                  <span>{tr('ટાઈમર થોભાવેલ છે', 'Timer Paused', 'टाइमर रुका हुआ है')}</span>
                </span>
              )}
              {status === 'idle' && (
                <span className="text-slate-400">
                  {tr('શરૂ કરવા તૈયાર છો? Start દબાવો', 'Ready? Click Start to begin 25m focus', 'तैयार हैं? शुरू करने के लिए Start दबाएं')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Basic Timer Controls (Start, Pause, Resume, Reset, Switch to Break) */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 w-full max-w-md z-10 pt-2">
          {status === 'idle' ? (
            <button
              type="button"
              onClick={startTimer}
              className="flex-1 py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base flex items-center justify-center space-x-2 shadow-xl shadow-blue-600/30 transition-all cursor-pointer transform active:scale-95"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{tr('અભ્યાસ સત્ર શરૂ કરો', 'Start 25m Study Session', 'अध्ययन सत्र शुरू करें')}</span>
            </button>
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
                className="py-3.5 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm flex items-center justify-center space-x-1.5 transition-all cursor-pointer active:scale-95"
                title={tr('રીસેટ કરો', 'Reset Timer', 'रीसेट करें')}
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
                className="flex-1 py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm sm:text-base flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer active:scale-95"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>{tr('ફરી શરૂ કરો (Resume)', 'Resume', 'पुनः शुरू करें (Resume)')}</span>
              </button>
              <button
                type="button"
                onClick={resetTimer}
                className="py-3.5 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm flex items-center justify-center space-x-1.5 transition-all cursor-pointer active:scale-95"
                title={tr('રીસેટ કરો', 'Reset Timer', 'रीसेट करें')}
              >
                <RotateCcw className="w-4 h-4" />
                <span>{tr('રીસેટ', 'Reset', 'रीसेट')}</span>
              </button>
            </>
          )}

          {/* Switch to Break Button */}
          <button
            type="button"
            onClick={() => setMode('break')}
            className="py-3.5 px-4 rounded-2xl bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer"
            title={tr('૫ મિનિટનો વિરામ શરૂ કરો', 'Switch to 5-Minute Break', '5 मिनट के ब्रेक पर जाएं')}
          >
            <Coffee className="w-4 h-4 text-emerald-400" />
            <span>{tr('વિરામ લો', 'Take Break', 'विराम लें')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PomodoroPage;
