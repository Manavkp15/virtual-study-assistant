import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, Headphones, FileText, Type, BookOpenCheck } from 'lucide-react';
import { tr } from '../utils/tr';
import { PDFSpeechReader } from '../components/PDFSpeechReader';
import { CustomTextInputTTS } from '../components/CustomTextInputTTS';
import { PDFSummaryNotes } from '../components/PDFSummaryNotes';

export const TextToSpeechPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const currentTab: 'pdf' | 'text' | 'summary' =
    rawTab === 'custom' || rawTab === 'text'
      ? 'text'
      : rawTab === 'summary' || rawTab === 'notes'
      ? 'summary'
      : 'pdf';

  const setTab = (tab: 'pdf' | 'text' | 'summary') => {
    setSearchParams({ tab });
  };

  return (
    <div className="space-y-6 pb-12 min-h-[calc(100vh-6rem)]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-start space-x-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-purple-400 shrink-0 shadow-lg shadow-purple-500/10">
            <Headphones className="w-7 h-7 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {tr(
                  'PDF વૉઇસ રીડર, TTS અને AI સારાંશ-નોટ્સ',
                  'PDF Voice Reader, Multilingual TTS & Study Notes',
                  'PDF वॉइस रीडर, बहुभाषी TTS और अध्ययन नोट्स'
                )}
              </h1>
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {tr(
                'પીડીએફ પુસ્તકો સાંભળો, કોઈપણ લખાણને કુદરતી અવાજમાં બદલો અથવા પીડીએફમાંથી રિવિઝન નોટ્સ, વ્યાખ્યાઓ અને પરીક્ષા પ્રશ્નો તૈયાર કરો.',
                'Listen aloud to study PDFs, convert text to speech with authentic Indic phonetics, or generate high-yield revision notes and summaries.',
                'अध्ययन सामग्री सुनें, पाठ को आवाज़ में बदलें या पीडीएफ से स्वतः त्वरित सारांश, परिभाषाएं और रिवीजन नोट्स बनाएं।'
              )}
            </p>
          </div>
        </div>

        {/* Supported Languages Badges */}
        <div className="flex items-center space-x-2 shrink-0 self-start sm:self-center">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-teal-500/10 text-teal-300 text-xs font-semibold border border-teal-500/25">
            <span>🇮🇳</span>
            <span>ગુજરાતી</span>
          </span>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-300 text-xs font-semibold border border-amber-500/25">
            <span>🇮🇳</span>
            <span>हिन्दी</span>
          </span>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-blue-500/10 text-blue-300 text-xs font-semibold border border-blue-500/25">
            <span>🇬🇧</span>
            <span>English</span>
          </span>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl w-fit shadow-md overflow-x-auto max-w-full">
        <button
          onClick={() => setTab('pdf')}
          className={`flex items-center space-x-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            currentTab === 'pdf'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>
            {tr('૧. PDF વૉઇસ રીડર (દસ્તાવેજ)', '1. PDF Voice Reader', '१. PDF वॉइस रीडर')}
          </span>
        </button>

        <button
          onClick={() => setTab('text')}
          className={`flex items-center space-x-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            currentTab === 'text'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Type className="w-4 h-4" />
          <span>
            {tr('૨. ટેક્સ્ટ-ટુ-સ્પીચ (ટાઇપ/પેસ્ટ)', '2. Text-to-Speech (Type/Paste)', '२. टेक्स्ट-टू-स्पीच (टाइप/पेस्ट)')}
          </span>
        </button>

        <button
          onClick={() => setTab('summary')}
          className={`flex items-center space-x-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
            currentTab === 'summary'
              ? 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white shadow-lg shadow-indigo-500/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <BookOpenCheck className="w-4 h-4" />
          <span>
            {tr('૩. PDF સારાંશ અને નોટ્સ (AI Notes)', '3. PDF Summary & Notes', '३. PDF सारांश और नोट्स')}
          </span>
        </button>
      </div>

      {/* Render Active Modality */}
      {currentTab === 'pdf' && <PDFSpeechReader />}
      {currentTab === 'text' && <CustomTextInputTTS />}
      {currentTab === 'summary' && <PDFSummaryNotes />}
    </div>
  );
};

export default TextToSpeechPage;
