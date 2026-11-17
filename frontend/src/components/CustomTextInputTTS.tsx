import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Sparkles,
  Copy,
  Check,
  Trash2,
  Settings2,
  Languages,
  Gauge,
  Mic,
  Headphones,
  Sliders,
  CheckCircle2,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { tr } from '../utils/tr';
import { useTextToSpeech, detectScriptLanguage } from '../hooks/useTextToSpeech';

export type LanguageMode = 'auto' | 'gu' | 'hi' | 'en';

interface SamplePrompt {
  id: string;
  title: string;
  lang: LanguageMode;
  flag: string;
  text: string;
  subject: string;
}

const SAMPLE_PROMPTS: SamplePrompt[] = [
  {
    id: 'gu-science',
    title: 'ગુજરાતી: પ્રકાશનું વક્રીભવન',
    lang: 'gu',
    flag: '🇮🇳',
    subject: 'વિજ્ઞાન (Science)',
    text: 'પ્રકાશનું વક્રીભવન: જ્યારે પ્રકાશનું કિરણ એક પારદર્શક માધ્યમમાંથી બીજા પારદર્શક માધ્યમમાં પ્રવેશે છે ત્યારે તે પોતાની ગતિ અને દિશા બદલે છે. આ કુદરતી ઘટનાને પ્રકાશનું વક્રીભવન કહે છે. ઉદાહરણ તરીકે, પાણી ભરેલા કાચના ગ્લાસમાં મૂકેલી પેન્સિલ વાંકી વળેલી દેખાય છે.'
  },
  {
    id: 'hi-science',
    title: 'हिन्दी: प्रकाश का अपवर्तन',
    lang: 'hi',
    flag: '🇮🇳',
    subject: 'विज्ञान (Science)',
    text: 'प्रकाश का अपवर्तन: जब प्रकाश की किरण एक पारदर्शी माध्यम से दूसरे पारदर्शी माध्यम में प्रवेश करती है, तो वह अपने मूल पथ से विचलित हो जाती है। इस परिघटना को प्रकाश का अपवर्तन कहते हैं। सघन माध्यम से विरल माध्यम में जाने पर किरण अभिलंब से दूर हटती है।'
  },
  {
    id: 'en-physics',
    title: 'English: Newton\'s Laws',
    lang: 'en',
    flag: '🇬🇧',
    subject: 'Physics',
    text: 'Newton\'s Third Law of Motion states that whenever one object exerts a force on a second object, the second object exerts an equal and opposite force on the first object. To every action, there is always an equal and opposite reaction.'
  },
  {
    id: 'gujlish-biology',
    title: 'મિશ્ર (Gujlish): કોષ રચના',
    lang: 'gu',
    flag: '🌐',
    subject: 'બાયોલોજી (Biology)',
    text: 'કોષ (Cell) એ દરેક સજીવનો પાયાનો રચનાત્મક અને ક્રિયાત્મક એકમ છે. વનસ્પતિ કોષમાં Cell Wall, Chloroplast અને મોટી રસધાની (Vacuole) જોવા મળે છે, જ્યારે પ્રાણી કોષમાં Cell Wall ગેરહાજર હોય છે.'
  }
];

export const CustomTextInputTTS: React.FC = () => {
  const { t } = useTranslation(['ai', 'common']);
  const tts = useTextToSpeech();

  const [text, setText] = useState<string>(
    'પ્રકાશનું વક્રીભવન: જ્યારે પ્રકાશનું કિરણ એક પારદર્શક માધ્યમમાંથી બીજા પારદર્શક માધ્યમમાં પ્રવેશે છે ત્યારે તે પોતાની ગતિ અને દિશા બદલે છે. આ ઘટનાને પ્રકાશનું વક્રીભવન કહે છે.'
  );
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageMode>('auto');
  const [showVoiceSettings, setShowVoiceSettings] = useState<boolean>(false);
  const [voiceFilterLang, setVoiceFilterLang] = useState<'all' | 'gu' | 'hi' | 'en'>('all');
  const [copied, setCopied] = useState<boolean>(false);
  const [previousVolume, setPreviousVolume] = useState<number>(1.0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Stop TTS when component unmounts
  useEffect(() => {
    return () => {
      tts.stop();
    };
  }, []);

  // Detect script language automatically
  const detectedLanguage = useMemo(() => {
    return detectScriptLanguage(text);
  }, [text]);

  const effectiveLanguage = useMemo(() => {
    if (selectedLanguage === 'auto') return detectedLanguage;
    return selectedLanguage;
  }, [selectedLanguage, detectedLanguage]);

  // Text stats
  const charCount = text.length;
  const wordCount = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [text]);

  const estimatedMinutes = useMemo(() => {
    if (wordCount === 0) return 0;
    // Standard speaking speed: ~130 words per minute at 1.0x
    const wpm = 130 * tts.rate;
    return Math.ceil((wordCount / wpm) * 60); // in seconds
  }, [wordCount, tts.rate]);

  // Voice filtering
  const gujaratiVoices = useMemo(
    () =>
      tts.voices.filter(
        (v) =>
          v.lang.toLowerCase().startsWith('gu') ||
          v.name.toLowerCase().includes('gujarati') ||
          v.name.toLowerCase().includes('dhwani')
      ),
    [tts.voices]
  );

  const hindiVoices = useMemo(
    () =>
      tts.voices.filter(
        (v) =>
          v.lang.toLowerCase().startsWith('hi') ||
          v.name.toLowerCase().includes('hindi') ||
          v.name.toLowerCase().includes('swara') ||
          v.name.toLowerCase().includes('madhur') ||
          v.name.toLowerCase().includes('kalpana') ||
          v.name.toLowerCase().includes('hemant')
      ),
    [tts.voices]
  );

  const englishVoices = useMemo(
    () => tts.voices.filter((v) => v.lang.toLowerCase().startsWith('en')),
    [tts.voices]
  );

  const displayedVoices = useMemo(() => {
    if (voiceFilterLang === 'gu') return gujaratiVoices;
    if (voiceFilterLang === 'hi') return hindiVoices;
    if (voiceFilterLang === 'en') return englishVoices;
    return tts.voices;
  }, [voiceFilterLang, gujaratiVoices, hindiVoices, englishVoices, tts.voices]);

  // Handlers
  const handlePlay = () => {
    if (!text.trim()) return;
    tts.speak('custom-tts-input', text, effectiveLanguage);
  };

  const handlePause = () => {
    tts.pause();
  };

  const handleResume = () => {
    tts.resume();
  };

  const handleStop = () => {
    tts.stop();
  };

  const handleClear = () => {
    tts.stop();
    setText('');
    textareaRef.current?.focus();
  };

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Clipboard copy failed:', err);
    }
  };

  const handleSelectSample = (sample: SamplePrompt) => {
    tts.stop();
    setText(sample.text);
    setSelectedLanguage(sample.lang);
  };

  const toggleMute = () => {
    if (tts.volume > 0) {
      setPreviousVolume(tts.volume);
      tts.setVolume(0);
    } else {
      tts.setVolume(previousVolume || 1.0);
    }
  };

  const isPlaying = tts.playbackState === 'playing';
  const isPaused = tts.playbackState === 'paused';
  const isSpeakingThis = tts.activeMessageId === 'custom-tts-input';

  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <div className="space-y-6">
      {/* Sample Presets Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
              {tr('ઝડપી નમૂના પાઠો (Quick Samples)', 'Quick Sample Prompts', 'त्वरित नमूना पाठ')}
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            {tr('ટેસ્ટ કરવા માટે કોઈપણ પર ક્લિક કરો', 'Click to test instant speech', 'परीक्षण के लिए क्लिक करें')}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {SAMPLE_PROMPTS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleSelectSample(sample)}
              className="text-left p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 transition-all group relative overflow-hidden shadow-sm"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-base">{sample.flag}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300 font-semibold group-hover:text-blue-300 transition-colors">
                  {sample.subject}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors truncate">
                {sample.title}
              </p>
              <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                {sample.text}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Text Input & Playback Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Textarea (2 cols on large screen) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 relative flex flex-col">
            {/* Header: Title & Actions */}
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Mic className="w-5 h-5 text-purple-400" />
                <span className="text-sm sm:text-base font-bold text-white">
                  {tr('લખાણ દાખલ કરો અથવા પેસ્ટ કરો', 'Enter or Paste Text', 'पाठ दर्ज करें या पेस्ट करें')}
                </span>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={handleCopy}
                  disabled={!text}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 hover:text-white text-xs font-semibold transition-all border border-slate-700"
                  title={tr('લખાણ કોપી કરો', 'Copy Text', 'पाठ कॉपी करें')}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">{tr('કોપી થયું', 'Copied', 'कॉपी किया')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{tr('કોપી', 'Copy', 'कॉपी')}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleClear}
                  disabled={!text}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/30 disabled:opacity-40 text-slate-300 hover:text-rose-300 text-xs font-semibold transition-all border border-slate-700 hover:border-rose-500/40"
                  title={tr('બધું સાફ કરો', 'Clear Text', 'साफ़ करें')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{tr('સાફ કરો', 'Clear', 'साफ़')}</span>
                </button>
              </div>
            </div>

            {/* Interactive Textarea */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={tr(
                  'તમારા પ્રશ્નો, અભ્યાસ નોંધો કે કોઈ પણ ફકરો અહીં ટાઇપ કરો અથવા પેસ્ટ કરો...',
                  'Type or paste any study notes, textbook paragraphs, or questions here...',
                  'अपने प्रश्न, अध्ययन नोट्स या कोई भी पैराग्राफ यहाँ टाइप करें या पेस्ट करें...'
                )}
                rows={10}
                className="w-full bg-slate-950/70 border border-slate-800 hover:border-slate-700 focus:border-blue-500 rounded-2xl p-4 sm:p-5 text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-y leading-relaxed font-normal"
              />
            </div>

            {/* Bottom Bar: Word Count & Detected Language Pill */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1 flex-wrap gap-2">
              <div className="flex items-center space-x-3">
                <span className="font-medium">
                  {charCount} {tr('અક્ષરો', 'Characters', 'अक्षर')}
                </span>
                <span>•</span>
                <span className="font-medium">
                  {wordCount} {tr('શબ્દો', 'Words', 'शब्द')}
                </span>
                {estimatedMinutes > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-slate-400">
                      ~{estimatedMinutes}s {tr('વાચન સમય', 'duration', 'अवधि')}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-400">
                  {tr('ઓળખાયેલી ભાષા:', 'Detected:', 'पहचानी गई भाषा:')}
                </span>
                <span
                  className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    effectiveLanguage === 'gu'
                      ? 'bg-teal-500/10 text-teal-300 border-teal-500/30'
                      : effectiveLanguage === 'hi'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                  }`}
                >
                  <span>
                    {effectiveLanguage === 'gu' ? '🇮🇳 ગુજરાતી' : effectiveLanguage === 'hi' ? '🇮🇳 हिन्दी' : '🇬🇧 English'}
                  </span>
                </span>
              </div>
            </div>

            {/* Active Speech Waveform & Spoken Snippet Bar */}
            {isPlaying && (
              <div className="mt-2 p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/60 via-purple-950/60 to-slate-900 border border-blue-500/40 flex items-center justify-between gap-3 animate-pulse">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="flex items-center space-x-1 shrink-0">
                    <span className="w-1.5 h-4 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-6 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-3 bg-teal-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.2s]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-blue-300 uppercase tracking-wider">
                      {tr('હાલમાં બોલાઈ રહ્યું છે...', 'Currently Speaking...', 'वर्तमान में बोला जा रहा है...')}
                    </p>
                    <p className="text-xs text-white truncate max-w-md font-medium">
                      {tts.currentSpokenText || text}
                    </p>
                  </div>
                </div>

                <span className="px-2 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-[10px] font-semibold shrink-0 border border-blue-500/30">
                  {tts.activeEngine === 'indic-neural' ? '⚡ AI Indic Voice' : '🌐 Browser Speech'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Controls, Voice Settings, Volume, Speed */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
            {/* Title */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {tr('અવાજ અને પ્લેબેક સેટિંગ્સ', 'Voice & Audio Controls', 'ध्वनि और प्लेबैक नियंत्रण')}
                </h3>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="space-y-2">
              {!isPlaying && !isPaused ? (
                <button
                  onClick={handlePlay}
                  disabled={!text.trim()}
                  className="w-full flex items-center justify-center space-x-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-40 text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-500/20 transition-all transform active:scale-[0.99]"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>{tr('બોલવાનું શરૂ કરો', 'Speak / Play', 'बोलना शुरू करें')}</span>
                </button>
              ) : isPlaying ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handlePause}
                    className="flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-lg shadow-amber-500/20 transition-all"
                  >
                    <Pause className="w-4 h-4 fill-current" />
                    <span>{tr('થોભો (Pause)', 'Pause', 'रोकें')}</span>
                  </button>

                  <button
                    onClick={handleStop}
                    className="flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-500/20 transition-all"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>{tr('બંધ કરો (Stop)', 'Stop', 'बंद करें')}</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleResume}
                    className="flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{tr('ચાલુ રાખો (Resume)', 'Resume', 'जारी रखें')}</span>
                  </button>

                  <button
                    onClick={handleStop}
                    className="flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-500/20 transition-all"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>{tr('બંધ કરો (Stop)', 'Stop', 'बंद करें')}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Language Selection Mode */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Languages className="w-4 h-4 text-purple-400" />
                  <span>{tr('ભાષા પસંદગી', 'Speech Language', 'भाषा का चयन')}</span>
                </span>
                <span className="text-[11px] text-blue-400 font-semibold">
                  {selectedLanguage === 'auto'
                    ? tr('સ્વચાલિત', 'Auto-Detect', 'स्वचालित')
                    : selectedLanguage.toUpperCase()}
                </span>
              </label>

              <div className="grid grid-cols-4 gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedLanguage('auto')}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold transition-all ${
                    selectedLanguage === 'auto'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                  title={tr('આપમેળે ભાષા ઓળખો', 'Auto-Detect Language', 'स्वचालित भाषा पहचान')}
                >
                  {tr('ઓટો', 'Auto', 'ऑटो')}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLanguage('gu')}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold transition-all ${
                    selectedLanguage === 'gu'
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                  title="ગુજરાતી (Gujarati)"
                >
                  ગુજરાતી
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLanguage('hi')}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold transition-all ${
                    selectedLanguage === 'hi'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                  title="हिन्दी (Hindi)"
                >
                  हिन्दी
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLanguage('en')}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold transition-all ${
                    selectedLanguage === 'en'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                  title="English"
                >
                  EN
                </button>
              </div>
            </div>

            {/* Speed Slider & Presets */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center space-x-1.5">
                  <Gauge className="w-4 h-4 text-emerald-400" />
                  <span>{tr('બોલવાની ઝડપ', 'Speech Speed', 'बोलने की गति')}</span>
                </span>
                <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                  {tts.rate}x
                </span>
              </div>

              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.25"
                value={tts.rate}
                onChange={(e) => tts.setRate(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />

              <div className="flex items-center justify-between gap-1 pt-1">
                {speedOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => tts.setRate(opt)}
                    className={`flex-1 py-1 text-[11px] rounded-lg font-semibold transition-all ${
                      tts.rate === opt
                        ? 'bg-emerald-500 text-white font-bold'
                        : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {opt}x
                  </button>
                ))}
              </div>
            </div>

            {/* Volume Control */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center space-x-1.5">
                  <Volume2 className="w-4 h-4 text-blue-400" />
                  <span>{tr('અવાજનું પ્રમાણ (વોલ્યુમ)', 'Volume', 'ध्वनि स्तर (वॉल्यूम)')}</span>
                </span>
                <span className="font-mono text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20">
                  {Math.round(tts.volume * 100)}%
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={toggleMute}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title={tts.volume === 0 ? 'Unmute' : 'Mute'}
                >
                  {tts.volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-blue-400" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1.0"
                  step="0.05"
                  value={tts.volume}
                  onChange={(e) => tts.setVolume(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>

            {/* Voice Selection Button */}
            <div className="pt-2">
              <button
                onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white transition-all"
              >
                <span className="flex items-center space-x-2">
                  <Settings2 className="w-4 h-4 text-purple-400" />
                  <span>{tr('વિશેષ અવાજ પસંદગી (Voices)', 'Select Voice', 'आवाज़ का चयन')}</span>
                </span>
                <span className="text-[11px] text-purple-400 max-w-[120px] truncate">
                  {effectiveLanguage === 'gu' || effectiveLanguage === 'hi'
                    ? 'AI Indic Neural'
                    : tts.selectedVoice
                    ? tts.selectedVoice.name
                    : 'Default'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Selection Modal / Drawer */}
      {showVoiceSettings && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {tr('અવાજ પસંદગી (Voice Selection)', 'Voice Settings', 'ध्वनि सेटिंग्स')}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {tr('તમારી પસંદગીનો અવાજ પસંદ કરો', 'Choose speech synthesis voice', 'अपनी पसंद की आवाज़ चुनें')}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowVoiceSettings(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
              <button
                onClick={() => setVoiceFilterLang('all')}
                className={`flex-1 py-1.5 rounded-xl font-semibold transition-all ${
                  voiceFilterLang === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tr('બધા', 'All', 'सभी')} ({tts.voices.length})
              </button>
              <button
                onClick={() => setVoiceFilterLang('gu')}
                className={`flex-1 py-1.5 rounded-xl font-semibold transition-all ${
                  voiceFilterLang === 'gu'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🇮🇳 {tr('ગુજરાતી', 'Gujarati', 'गुजराती')} ({gujaratiVoices.length})
              </button>
              <button
                onClick={() => setVoiceFilterLang('hi')}
                className={`flex-1 py-1.5 rounded-xl font-semibold transition-all ${
                  voiceFilterLang === 'hi'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🇮🇳 {tr('हिन्दी', 'Hindi', 'हिन्दी')} ({hindiVoices.length})
              </button>
              <button
                onClick={() => setVoiceFilterLang('en')}
                className={`flex-1 py-1.5 rounded-xl font-semibold transition-all ${
                  voiceFilterLang === 'en'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🇬🇧 English ({englishVoices.length})
              </button>
            </div>

            {/* Notice regarding Indic Neural Engine */}
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
              <div>
                <span className="font-bold">
                  {tr('Google Indic Neural Engine:', 'Google Indic Neural Engine:', 'Google Indic Neural Engine:')}
                </span>{' '}
                {tr(
                  'ગુજરાતી અને હિન્દી માટે અમારું સિસ્ટમ સર્વર-આધારિત કુદરતી અવાજ પ્રોક્સી વાપરે છે, જે કમ્પ્યુટર કે ફોનમાં સ્થાનિક અવાજ ન હોય તો પણ અસ્ખલિત વાચન પૂરું પાડે છે.',
                  'For Gujarati and Hindi, the system leverages high-fidelity Indic neural speech with accurate matras and phonetics.',
                  'गुजराती और हिन्दी के लिए सिस्टम सर्वर-आधारित प्राकृतिक आवाज़ का उपयोग करता है जो शुद्ध उच्चारण प्रदान करता है।'
                )}
              </div>
            </div>

            {/* Voice List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-64">
              {/* Default Option */}
              <button
                onClick={() => {
                  tts.setSelectedVoice(null);
                  setShowVoiceSettings(false);
                }}
                className={`w-full text-left p-3 rounded-2xl border transition-all text-xs flex items-center justify-between ${
                  tts.selectedVoice === null
                    ? 'bg-blue-600/20 border-blue-500/50 text-white font-bold'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div>
                  <p className="font-semibold text-white">
                    {tr('સ્વચાલિત ડિફોલ્ટ અવાજ', 'System Default (Recommended)', 'सिस्टम डिफ़ॉल्ट (अनुशंसित)')}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {tr('ભાષા મુજબ આપમેળે શ્રેષ્ઠ અવાજ પસંદ કરે છે', 'Auto-selects optimal voice for the language', 'भाषा के अनुसार सर्वोत्तम आवाज़ चुनता है')}
                  </p>
                </div>
                {tts.selectedVoice === null && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
              </button>

              {displayedVoices.map((voice) => {
                const isSelected = tts.selectedVoice?.name === voice.name;
                return (
                  <button
                    key={voice.name}
                    onClick={() => {
                      tts.setSelectedVoice(voice);
                      setShowVoiceSettings(false);
                    }}
                    className={`w-full text-left p-3 rounded-2xl border transition-all text-xs flex items-center justify-between ${
                      isSelected
                        ? 'bg-purple-600/20 border-purple-500/50 text-white font-bold'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-white truncate">{voice.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {voice.lang} {voice.localService ? '• Local' : '• Online'}
                      </p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-purple-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowVoiceSettings(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
              >
                {tr('બંધ કરો', 'Close', 'बंद करें')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
