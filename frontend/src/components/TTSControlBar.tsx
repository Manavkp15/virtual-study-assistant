import React, { useState } from 'react';
import { Volume2, VolumeX, Play, Pause, Square, Gauge, Mic, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TTSState } from '../hooks/useTextToSpeech';

interface TTSControlBarProps {
  messageId: string | number;
  text: string;
  tts: TTSState;
  langHint?: string;
}

export const TTSControlBar: React.FC<TTSControlBarProps> = ({
  messageId,
  text,
  tts,
  langHint
}) => {
  const { t } = useTranslation('ai');
  const [showSettings, setShowSettings] = useState(false);

  const isActive = tts.activeMessageId === messageId;
  const isPlaying = isActive && tts.playbackState === 'playing';
  const isPaused = isActive && tts.playbackState === 'paused';

  if (!tts.isSupported) {
    return (
      <div className="pt-2 flex items-center space-x-1.5 text-[10px] text-slate-500 italic">
        <VolumeX className="w-3 h-3 text-slate-500" />
        <span>{t('tts.unsupported', 'Text-to-Speech is not supported in this browser.')}</span>
      </div>
    );
  }

  const speedOptions = [0.75, 1.0, 1.25, 1.5];

  return (
    <div className="pt-2 mt-1 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs select-none">
      {/* Primary Actions & Status */}
      <div className="flex items-center space-x-2 flex-wrap">
        {!isActive ? (
          <button
            onClick={() => tts.speak(messageId, text, langHint)}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40 text-[11px] font-semibold transition-all group"
            title={t('tts.readAloud', 'Read Aloud')}
          >
            <Volume2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>{t('tts.readAloud', 'Read Aloud')}</span>
          </button>
        ) : (
          <div className="inline-flex items-center space-x-1.5 bg-slate-900/90 border border-blue-500/40 rounded-xl px-2 py-1 shadow-md">
            {/* Status Pill with wave animation */}
            <div className="flex items-center space-x-1.5 pr-1.5 border-r border-slate-700">
              <div className="flex items-end space-x-0.5 h-3">
                <span className={`w-0.5 bg-blue-400 rounded-full transition-all ${isPlaying ? 'h-3 animate-pulse' : 'h-1'}`} />
                <span className={`w-0.5 bg-blue-400 rounded-full transition-all ${isPlaying ? 'h-2 animate-pulse delay-75' : 'h-1'}`} />
                <span className={`w-0.5 bg-blue-400 rounded-full transition-all ${isPlaying ? 'h-3.5 animate-pulse delay-150' : 'h-1'}`} />
              </div>
              <span className="text-[10px] font-bold text-blue-300">
                {isPlaying ? t('tts.reading', 'Reading...') : t('tts.paused', 'Paused')}
              </span>
            </div>

            {/* Pause / Resume button */}
            {isPlaying ? (
              <button
                onClick={tts.pause}
                className="p-1 rounded-lg hover:bg-slate-800 text-amber-400 hover:text-amber-300 transition-colors"
                title={t('tts.pause', 'Pause')}
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                onClick={tts.resume}
                className="p-1 rounded-lg hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 transition-colors"
                title={t('tts.resume', 'Resume')}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            )}

            {/* Stop button */}
            <button
              onClick={tts.stop}
              className="p-1 rounded-lg hover:bg-slate-800 text-rose-400 hover:text-rose-300 transition-colors"
              title={t('tts.stop', 'Stop')}
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>
        )}

        {/* Speed Adjustment Pill */}
        <div className="inline-flex items-center space-x-1 bg-slate-900/60 rounded-lg p-0.5 border border-slate-800 text-[10px]">
          <Gauge className="w-3 h-3 text-slate-400 ml-1" />
          {speedOptions.map((s) => (
            <button
              key={s}
              onClick={() => tts.setRate(s)}
              className={`px-1.5 py-0.5 rounded transition-all font-medium ${
                tts.rate === s
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Voice Selection Toggle & Dropdown */}
      {tts.voices.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowSettings(prev => !prev)}
            className={`p-1.5 rounded-lg border transition-all text-slate-400 hover:text-slate-200 flex items-center space-x-1 text-[10px] ${
              showSettings || tts.selectedVoice
                ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
            title={t('tts.voice', 'Voice Settings')}
          >
            <Mic className="w-3 h-3" />
            <span className="hidden sm:inline">
              {tts.selectedVoice ? tts.selectedVoice.name.split(' ')[0] : t('tts.voice', 'Voice')}
            </span>
          </button>

          {showSettings && (
            <div className="absolute right-0 bottom-full mb-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 z-50 space-y-2 backdrop-blur-md">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-200 border-b border-slate-800 pb-1.5">
                <span className="flex items-center space-x-1.5">
                  <Settings2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>{t('tts.voice', 'Voice Selection')}</span>
                </span>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-slate-400 hover:text-white text-xs px-1"
                >
                  ✕
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1 pr-1 text-left">
                <button
                  onClick={() => {
                    tts.setSelectedVoice(null);
                    setShowSettings(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl text-[11px] transition-all flex items-center justify-between ${
                    tts.selectedVoice === null
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>✨ {t('tts.defaultVoice', 'Auto (Gujarati / Hindi / English)')}</span>
                </button>

                {tts.voices.map((v, i) => (
                  <button
                    key={`${v.name}-${i}`}
                    onClick={() => {
                      tts.setSelectedVoice(v);
                      setShowSettings(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-[11px] transition-all truncate flex items-center justify-between ${
                      tts.selectedVoice?.name === v.name
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                    title={`${v.name} (${v.lang})`}
                  >
                    <span className="truncate max-w-[170px]">{v.name}</span>
                    <span className="text-[9px] uppercase px-1 py-0.5 bg-slate-800 rounded text-slate-400 shrink-0 ml-1">
                      {v.lang.split('-')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
