import React from 'react';
import { Volume2, Sparkles, BookOpen, Headphones } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { tr } from '../utils/tr';
import { PDFSpeechReader } from '../components/PDFSpeechReader';

export const TextToSpeechPage: React.FC = () => {
  const { t } = useTranslation('common');

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
                  'ટેક્સ્ટ-ટુ-સ્પીચ (PDF અવાજ વાચક)',
                  'Text to Speech (PDF Voice Reader)',
                  'टेक्स्ट-टू-स्पीच (PDF वॉइस रीडर)'
                )}
              </h1>
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {tr(
                'તમારા અભ્યાસની કોઈપણ પીડીએફ (.pdf) ફાઇલ અપલોડ કરો અને તેને ગુજરાતી, હિન્દી કે અંગ્રેજીમાં કુદરતી ઉચ્ચારણ સાથે સાંભળો.',
                'Upload any study PDF document to listen aloud with authentic Gujarati, Hindi, and English pronunciation.',
                'अपने अध्ययन का कोई भी पीडीएफ दस्तावेज़ अपलोड करें और इसे गुजराती, हिन्दी या अंग्रेज़ी में प्राकृतिक आवाज़ में सुनें।'
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

      {/* PDF Reader Component */}
      <PDFSpeechReader />
    </div>
  );
};

export default TextToSpeechPage;
