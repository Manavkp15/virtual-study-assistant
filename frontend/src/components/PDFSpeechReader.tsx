import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  FileText,
  UploadCloud,
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Gauge,
  Mic,
  Settings2,
  RefreshCw,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Globe
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { tr } from '../utils/tr';
import { extractTextFromPdf, ExtractedPdf } from '../utils/pdfExtractor';
import { useTextToSpeech, detectScriptLanguage } from '../hooks/useTextToSpeech';

export type ReaderLanguageMode = 'auto' | 'gu' | 'hi' | 'en';

const SAMPLE_PRESETS: Record<'trilingual' | 'gujarati' | 'hindi', ExtractedPdf> = {
  trilingual: {
    fileName: 'Science_Force_and_Pressure_Trilingual.pdf',
    numPages: 2,
    totalWords: 210,
    pages: [
      {
        pageNumber: 1,
        text: 'Science Chapter 11: Force and Pressure. Contact and non-contact forces in English, Gujarati, and Hindi.',
        paragraphs: [
          'Science Chapter 11: Force and Pressure. A force is a push or pull upon an object resulting from its interaction with another object.',
          'વિજ્ઞાન પ્રકરણ ૧૧: બળ અને દબાણ. બળ એ કોઈ વસ્તુ પર થતો ધક્કો કે ખેંચાણ છે. જ્યારે બે પદાર્થો વચ્ચે પરસ્પર આંતરક્રિયા થાય છે ત્યારે બળ ઉદ્ભવે છે.',
          'विज्ञान अध्याय ११: बल तथा दाब। किसी वस्तु पर लगने वाले धक्के (अभिकर्षण) या खिंचाव (अपकर्षण) को बल कहते हैं। दो वस्तुओं के बीच अन्योन्यक्रिया के कारण बल कार्य करता है।',
          'Contact forces include muscular force, friction, and normal force. Non-contact forces include gravitational, electrostatic, and magnetic forces.',
          'સંપર્ક બળોમાં સ્નાયુ બળ અને ઘર્ષણ બળ આવે છે, જ્યારે અસંપર્ક બળોમાં ગુરુત્વાકર્ષણ બળ અને ચુંબકીય બળનો સમાવેશ થાય છે.',
          'सम्पर्क बलों में पेशीय बल तथा घर्षण बल शामिल हैं, जबकि असम्पर्क बलों में गुरुत्वाकर्षण बल तथा चुम्बकीय बल आते हैं।'
        ]
      },
      {
        pageNumber: 2,
        text: 'Pressure and Atmospheric Pressure in English, Gujarati, and Hindi.',
        paragraphs: [
          'Pressure is defined as the force applied perpendicular to the surface of an object per unit area. The SI unit of pressure is Pascal (Pa).',
          'દબાણ એટલે એકમ ક્ષેત્રફળ દીઠ સપાટી પર લંબરૂપે લાગતું બળ. દબાણનો SI એકમ પાસ્કલ (Pa) અથવા ન્યૂટન પ્રતિ ચોરસ મીટર છે.',
          'प्रति एकांक क्षेत्रफल पर लगने वाले लंबवत बल को दाब कहते हैं। दाब का अंतर्राष्ट्रीय मात्रक पास्कल (Pa) अथवा न्यूटन प्रति वर्ग मीटर है।',
          'વાતાવરણીય દબાણ: પૃથ્વીની આસપાસ રહેલી હવાના આવરણ દ્વારા સપાટી પર લાગતા દબાણને વાતાવરણનું દબાણ કહે છે.',
          'वायुमंडलीय दाब: हमारे चारों ओर उपस्थित वायुमण्डल द्वारा पृथ्वी की सतह पर लगाए गए दाब को वायुमंडलीय दाब कहते हैं।'
        ]
      }
    ]
  },
  gujarati: {
    fileName: 'વિજ્ઞાન_પ્રકરણ_૧૧_બળ_અને_દબાણ.pdf',
    numPages: 2,
    totalWords: 180,
    pages: [
      {
        pageNumber: 1,
        text: 'વિજ્ઞાન પ્રકરણ ૧૧: બળ અને તેના વિવિધ પ્રકારો.',
        paragraphs: [
          'ધોરણ ૮ વિજ્ઞાન - પ્રકરણ ૧૧: બળ અને દબાણ. કોઈપણ પદાર્થને ગતિમાં લાવવા અથવા તેની ગતિની દિશા બદલવા માટે બળ જરૂરી છે.',
          'બળ એ કોઈ વસ્તુ પર થતો ધક્કો કે ખેંચાણ છે. જ્યારે બે પદાર્થો વચ્ચે પરસ્પર આંતરક્રિયા થાય છે ત્યારે જ બળ ઉદ્ભવે છે.',
          'સ્નાયુ બળ: આપણા શરીરના સ્નાયુઓની ક્રિયા દ્વારા લાગતા બળને સ્નાયુ બળ કહે છે. પ્રાણીઓ પણ બોજ વહન કરવા માટે સ્નાયુ બળનો ઉપયોગ કરે છે.',
          'ઘર્ષણ બળ: ગતિની વિરુદ્ધ દિશામાં લાગતું બળ ઘર્ષણ બળ કહેવાય છે. ઘર્ષણના કારણે જ આપણે લપસ્યા વગર જમીન પર ચાલી શકીએ છીએ.'
        ]
      },
      {
        pageNumber: 2,
        text: 'દબાણ, પ્રવાહીનું દબાણ અને વાતાવરણીય દબાણ.',
        paragraphs: [
          'દબાણ = બળ / ક્ષેત્રફળ. એકમ ક્ષેત્રફળ દીઠ સપાટી પર લંબરૂપે લાગતા બળને દબાણ કહેવાય છે. દબાણનો SI એકમ પાસ્કલ (Pa) છે.',
          'જો સપાટીનું ક્ષેત્રફળ ઓછું હોય, તો તેટલા જ બળ વડે વધુ દબાણ સર્જાય છે. આથી જ તીક્ષ્ણ છરી શાકભાજીને સરળતાથી કાપી શકે છે.',
          'પ્રવાહી અને વાયુઓ પણ પાત્રની દીવાલો પર દબાણ કરે છે. જેમ ઊંડાઈ વધે તેમ પ્રવાહીનું દબાણ પણ વધે છે.',
          'વાતાવરણીય દબાણ: આપણી ચારેય તરફ રહેલા વાતાવરણની હવા દ્વારા લાગતા દબાણને વાતાવરણનું દબાણ કહેવામાં આવે છે.'
        ]
      }
    ]
  },
  hindi: {
    fileName: 'विज्ञान_अध्याय_११_बल_तथा_दाब.pdf',
    numPages: 2,
    totalWords: 185,
    pages: [
      {
        pageNumber: 1,
        text: 'विज्ञान अध्याय ११: बल तथा इसके विभिन्न प्रकार।',
        paragraphs: [
          'कक्षा ८ विज्ञान - अध्याय ११: बल तथा दाब। किसी वस्तु पर लगने वाले धक्के (अभिकर्षण) या खिंचाव (अपकर्षण) को बल कहते हैं।',
          'बल दो वस्तुओं के बीच अन्योन्यक्रिया के कारण उत्पन्न होता है। बल किसी स्थिर वस्तु को गतिशील कर सकता है तथा उसकी गति की दिशा बदल सकता है।',
          'सम्पर्क बल: जब बल लगाने के लिए वस्तु से सीधा भौतिक सम्पर्क आवश्यक हो, जैसे पेशीय बल तथा घर्षण बल। हमारे शरीर की मांसपेशियों द्वारा लगने वाला बल पेशीय बल कहलाता है।',
          'असम्पर्क बल: जो बल बिना किसी भौतिक सम्पर्क के दूर से कार्य करते हैं, उन्हें असम्पर्क बल कहते हैं; जैसे गुरुत्वाकर्षण बल तथा चुम्बकीय बल।'
        ]
      },
      {
        pageNumber: 2,
        text: 'दाब तथा वायुमंडलीय दाब की महत्वपूर्ण अवधारणाएँ।',
        paragraphs: [
          'दाब = बल / क्षेत्रफल। किसी पृष्ठ के प्रति एकांक क्षेत्रफल पर लगने वाले लंबवत बल को दाब कहते हैं। दाब का अंतर्राष्ट्रीय मात्रक पास्कल (Pa) है।',
          'कील का नुकीला सिरा दीवार में आसानी से क्यों धंस जाता है? क्योंकि क्षेत्रफल कम होने पर दाब अधिक लगता है।',
          'द्रव तथा गैसें भी बर्तन की दीवारों पर दाब डालते हैं। गहराई बढ़ने के साथ द्रव का दाब भी बढ़ जाता है।',
          'वायुमंडलीय दाब: हमारे चारों ओर उपस्थित वायुमण्डल द्वारा पृथ्वी की सतह पर लगाए गए दाब को वायुमंडलीय दाब कहते हैं।'
        ]
      }
    ]
  }
};

export const PDFSpeechReader: React.FC = () => {
  const { t } = useTranslation(['ai', 'common']);
  const tts = useTextToSpeech();

  const [extractedPdf, setExtractedPdf] = useState<ExtractedPdf | null>(null);
  const [currentPageIdx, setCurrentPageIdx] = useState<number>(0);
  const [activeParagraphIdx, setActiveParagraphIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [autoAdvance, setAutoAdvance] = useState<boolean>(true);
  const [showVoiceSettings, setShowVoiceSettings] = useState<boolean>(false);

  // Language Controls for Gujarati & Hindi
  const [selectedLanguage, setSelectedLanguage] = useState<ReaderLanguageMode>('auto');
  const [voiceFilterLang, setVoiceFilterLang] = useState<'all' | 'gu' | 'hi' | 'en'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const paragraphRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Keep refs to avoid stale closures in TTS onEnd chain
  const extractedPdfRef = useRef<ExtractedPdf | null>(extractedPdf);
  const autoAdvanceRef = useRef<boolean>(autoAdvance);
  const selectedLanguageRef = useRef<ReaderLanguageMode>(selectedLanguage);
  const playParagraphRef = useRef<(pageIndex: number, paragraphIndex: number) => void>(() => {});

  extractedPdfRef.current = extractedPdf;
  autoAdvanceRef.current = autoAdvance;
  selectedLanguageRef.current = selectedLanguage;

  // Stop TTS when component unmounts
  useEffect(() => {
    return () => {
      tts.stop();
    };
  }, []);

  // Auto-scroll to active paragraph
  useEffect(() => {
    if (activeParagraphIdx !== null && paragraphRefs.current[activeParagraphIdx]) {
      paragraphRefs.current[activeParagraphIdx]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [activeParagraphIdx]);

  // Handle uploaded file
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage(tr('કૃપા કરીને ફક્ત પીડીએફ (.pdf) ફાઇલ અપલોડ કરો.', 'Please upload a valid PDF document (.pdf).'));
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    tts.stop();
    setActiveParagraphIdx(null);

    try {
      const data = await extractTextFromPdf(file);
      setExtractedPdf(data);
      setCurrentPageIdx(0);
    } catch (err: any) {
      console.error('Failed to extract PDF text:', err);
      setErrorMessage(
        tr(
          'પીડીએફમાંથી લખાણ વાંચવામાં ભૂલ આવી. કૃપા કરીને અન્ય ફાઇલ અજમાવો.',
          'Failed to extract text from this PDF. It may be password-protected or image-only.'
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Load a sample preset
  const handleLoadPreset = (presetKey: 'trilingual' | 'gujarati' | 'hindi') => {
    tts.stop();
    setActiveParagraphIdx(null);
    setErrorMessage(null);
    const preset = SAMPLE_PRESETS[presetKey];
    setExtractedPdf(preset);
    setCurrentPageIdx(0);

    if (presetKey === 'gujarati') {
      setSelectedLanguage('gu');
    } else if (presetKey === 'hindi') {
      setSelectedLanguage('hi');
    } else {
      setSelectedLanguage('auto');
    }
  };

  const currentPage = extractedPdf?.pages[currentPageIdx] || null;

  // Speak a specific paragraph with auto-advance and accurate language hint
  const playParagraph = useCallback(
    (pageIndex: number, paragraphIndex: number) => {
      const doc = extractedPdfRef.current;
      if (!doc) return;
      const targetPage = doc.pages[pageIndex];
      if (!targetPage) return;
      const textToRead = targetPage.paragraphs[paragraphIndex];
      if (!textToRead) return;

      setCurrentPageIdx(pageIndex);
      setActiveParagraphIdx(paragraphIndex);

      const messageId = `pdf-p-${pageIndex}-${paragraphIndex}`;

      // Language resolution: if 'auto', dynamically detect from paragraph text
      const currentMode = selectedLanguageRef.current;
      const effectiveLang =
        currentMode === 'auto'
          ? detectScriptLanguage(textToRead)
          : currentMode;

      tts.speak(messageId, textToRead, effectiveLang, () => {
        // Callback when paragraph speech ends
        if (autoAdvanceRef.current) {
          const latestDoc = extractedPdfRef.current;
          if (!latestDoc) {
            setActiveParagraphIdx(null);
            return;
          }
          const latestPage = latestDoc.pages[pageIndex];
          if (latestPage && paragraphIndex + 1 < latestPage.paragraphs.length) {
            playParagraphRef.current(pageIndex, paragraphIndex + 1);
          } else if (pageIndex + 1 < latestDoc.pages.length) {
            // Move to next page
            playParagraphRef.current(pageIndex + 1, 0);
          } else {
            // Reached end of document
            setActiveParagraphIdx(null);
          }
        } else {
          setActiveParagraphIdx(null);
        }
      });
    },
    [tts]
  );

  playParagraphRef.current = playParagraph;

  const handlePlayCurrent = () => {
    if (!currentPage) return;
    const startIndex = activeParagraphIdx !== null ? activeParagraphIdx : 0;
    playParagraph(currentPageIdx, startIndex);
  };

  const handleNextParagraph = () => {
    if (!currentPage) return;
    const nextIdx = (activeParagraphIdx ?? -1) + 1;
    if (nextIdx < currentPage.paragraphs.length) {
      playParagraph(currentPageIdx, nextIdx);
    } else if (currentPageIdx + 1 < (extractedPdf?.pages.length || 0)) {
      playParagraph(currentPageIdx + 1, 0);
    }
  };

  const handlePrevParagraph = () => {
    if (!currentPage) return;
    const prevIdx = (activeParagraphIdx ?? 1) - 1;
    if (prevIdx >= 0) {
      playParagraph(currentPageIdx, prevIdx);
    } else if (currentPageIdx > 0) {
      const prevPage = extractedPdf!.pages[currentPageIdx - 1];
      playParagraph(currentPageIdx - 1, prevPage.paragraphs.length - 1);
    }
  };

  const handleStop = () => {
    tts.stop();
    setActiveParagraphIdx(null);
  };

  const isReadingCurrentPage =
    tts.activeMessageId !== null &&
    tts.activeMessageId.toString().startsWith(`pdf-p-${currentPageIdx}-`);

  const speedOptions = [0.75, 1.0, 1.25, 1.5];

  // Filter voices for the voice selector modal
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

  // Current active paragraph language
  const currentActiveParagraphLanguage = useMemo(() => {
    if (activeParagraphIdx === null || !currentPage?.paragraphs[activeParagraphIdx]) {
      return null;
    }
    const text = currentPage.paragraphs[activeParagraphIdx];
    return selectedLanguage === 'auto' ? detectScriptLanguage(text) : selectedLanguage;
  }, [activeParagraphIdx, currentPage, selectedLanguage]);

  return (
    <div className="space-y-6">
      {/* Upload Zone (shown when no PDF is loaded) */}
      {!extractedPdf && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl text-center space-y-6">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-blue-500/40 hover:border-blue-400 bg-slate-800/40 hover:bg-slate-800/70 rounded-3xl p-8 sm:p-12 transition-all flex flex-col items-center justify-center space-y-4 cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-white">
                {tr(
                  'તમારો પીડીએફ દસ્તાવેજ અપલોડ કરો',
                  'Upload your PDF Document for Text-to-Speech',
                  'टेक्स्ट-टू-स्पीच के लिए अपना पीडीएफ दस्तावेज़ अपलोड करें'
                )}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {tr(
                  'પીડીએફ ફાઇલને અહીં ડ્રેગ કરો અથવા ક્લિક કરીને પસંદ કરો. ગુજરાતી, હિન્દી અને અંગ્રેજી ભાષાઓમાં વાચન સપોર્ટેડ છે.',
                  'Drag and drop your PDF here, or click to browse. Speech reader supports Gujarati, Hindi, and English.',
                  'अपनी पीडीएफ फाइल यहाँ खींचें या क्लिक करके चुनें। गुजराती, हिन्दी और अंग्रेज़ी भाषाओं में वाचन समर्थित है।'
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-300 text-[11px] font-semibold border border-teal-500/20">
                <span>🇮🇳 ગુજરાતી</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 text-[11px] font-semibold border border-amber-500/20">
                <span>🇮🇳 हिन्दी</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 text-[11px] font-semibold border border-blue-500/20">
                <span>🇬🇧 English</span>
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
            />
          </div>

          {loading && (
            <div className="flex items-center justify-center space-x-3 py-4 text-blue-400 text-xs font-semibold">
              <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span>
                {tr(
                  'પીડીએફમાંથી લખાણ તૈયાર થઈ રહ્યું છે...',
                  'Extracting and parsing PDF text...',
                  'पीडीएफ से पाठ निकाला जा रहा है...'
                )}
              </span>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center justify-center space-x-2 text-rose-400 text-xs font-semibold bg-rose-500/10 border border-rose-500/20 p-3 rounded-2xl">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Demo Presets */}
          <div className="pt-2 flex flex-col items-center justify-center space-y-3">
            <span className="text-xs text-slate-400 font-medium">
              {tr(
                'અથવા નમૂના પાઠ્ય નોંધો સાથે સીધો ટેસ્ટ કરો:',
                'Or test instantly with sample notes:',
                'या नमूना नोट्स के साथ तुरंत परीक्षण करें:'
              )}
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                onClick={() => handleLoadPreset('trilingual')}
                disabled={loading}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>{tr('સર્વભાષી (EN + GU + HI)', 'Trilingual (EN + GU + HI)', 'त्रिभाषी (EN + GU + HI)')}</span>
              </button>

              <button
                onClick={() => handleLoadPreset('gujarati')}
                disabled={loading}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 text-xs font-semibold transition-all shadow-sm"
              >
                <span>🇮🇳 {tr('ગુજરાતી નોંધો (વિજ્ઞાન)', 'Gujarati Notes (Science)', 'गुजराती नोट्स (विज्ञान)')}</span>
              </button>

              <button
                onClick={() => handleLoadPreset('hindi')}
                disabled={loading}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all shadow-sm"
              >
                <span>🇮🇳 {tr('હિન્દી નોંધો (વિજ્ઞાન)', 'Hindi Notes (Science)', 'हिन्दी नोट्स (विज्ञान)')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reader Interface (shown when a PDF is loaded) */}
      {extractedPdf && (
        <div className="space-y-4">
          {/* Document Header & Navigation Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 shrink-0 border border-blue-500/20">
                <FileText className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-white text-sm sm:text-base truncate max-w-md">
                  {extractedPdf.fileName}
                </h3>
                <p className="text-[11px] text-slate-400 flex items-center space-x-3 mt-0.5">
                  <span>
                    {extractedPdf.numPages} {tr('પાના', 'Pages', 'पृष्ठ')}
                  </span>
                  <span>•</span>
                  <span>
                    ~{extractedPdf.totalWords} {tr('શબ્દો', 'Words', 'शब्द')}
                  </span>
                  <span>•</span>
                  <span className="text-blue-400 font-semibold flex items-center space-x-1">
                    <Globe className="w-3 h-3" />
                    <span>
                      {selectedLanguage === 'auto'
                        ? tr('સ્વચાલિત ભાષા મોડ', 'Auto Language Mode', 'स्वचालित भाषा मोड')
                        : selectedLanguage === 'gu'
                        ? 'ગુજરાતી મોડ'
                        : selectedLanguage === 'hi'
                        ? 'हिन्दी મોડ'
                        : 'English Mode'}
                    </span>
                  </span>
                </p>
              </div>
            </div>

            {/* Actions: Page Nav & Presets / Change File */}
            <div className="flex items-center space-x-2.5 flex-wrap">
              {/* Preset quick switcher */}
              <div className="hidden lg:inline-flex items-center space-x-1 bg-slate-800/80 border border-slate-700 rounded-xl p-0.5 text-[11px]">
                <button
                  onClick={() => handleLoadPreset('trilingual')}
                  className="px-2 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-all"
                  title="Load Trilingual Sample"
                >
                  EN+GU+HI
                </button>
                <button
                  onClick={() => handleLoadPreset('gujarati')}
                  className="px-2 py-1 rounded-lg text-teal-300 hover:text-white hover:bg-teal-700/40 transition-all font-medium"
                  title="Load Gujarati Sample"
                >
                  ગુજરાતી
                </button>
                <button
                  onClick={() => handleLoadPreset('hindi')}
                  className="px-2 py-1 rounded-lg text-amber-300 hover:text-white hover:bg-amber-700/40 transition-all font-medium"
                  title="Load Hindi Sample"
                >
                  हिन्दी
                </button>
              </div>

              {/* Page Navigator */}
              <div className="inline-flex items-center space-x-1 bg-slate-800/80 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
                <button
                  onClick={() => {
                    tts.stop();
                    setActiveParagraphIdx(null);
                    setCurrentPageIdx((prev) => Math.max(0, prev - 1));
                  }}
                  disabled={currentPageIdx === 0}
                  className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition-colors"
                  title={tr('પાછલું પાનું', 'Previous Page', 'पिछला पृष्ठ')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="font-bold text-slate-200 px-1 text-[11px]">
                  {tr('પાનું', 'Page', 'पृष्ठ')} {currentPageIdx + 1} / {extractedPdf.numPages}
                </span>

                <button
                  onClick={() => {
                    tts.stop();
                    setActiveParagraphIdx(null);
                    setCurrentPageIdx((prev) => Math.min(extractedPdf.numPages - 1, prev + 1));
                  }}
                  disabled={currentPageIdx === extractedPdf.numPages - 1}
                  className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition-colors"
                  title={tr('આગલું પાનું', 'Next Page', 'अगला पृष्ठ')}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Upload Different PDF Button */}
              <button
                onClick={() => {
                  tts.stop();
                  setExtractedPdf(null);
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{tr('અન્ય PDF', 'Change PDF', 'अन्य PDF')}</span>
              </button>
            </div>
          </div>

          {/* Sticky Audio Control Dock */}
          <div className="bg-slate-900/95 backdrop-blur-md border border-blue-500/30 rounded-3xl p-4 shadow-2xl flex flex-wrap items-center justify-between gap-4 sticky top-4 z-20">
            {/* Primary Audio Buttons */}
            <div className="flex items-center space-x-2 flex-wrap">
              {/* Play / Pause / Resume */}
              {tts.playbackState === 'playing' ? (
                <button
                  onClick={tts.pause}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all"
                  title={t('tts.pause', 'Pause')}
                >
                  <Pause className="w-4 h-4 fill-current" />
                  <span>{t('tts.pause', 'Pause')}</span>
                </button>
              ) : tts.playbackState === 'paused' ? (
                <button
                  onClick={tts.resume}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
                  title={t('tts.resume', 'Resume')}
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{t('tts.resume', 'Resume')}</span>
                </button>
              ) : (
                <button
                  onClick={handlePlayCurrent}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all"
                  title={tr('વાંચો / શરૂ કરો', 'Read Aloud', 'बोलकर सुनाएं')}
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{tr('વાંચો / સાંભળો', 'Read Aloud', 'बोलकर सुनाएं')}</span>
                </button>
              )}

              {/* Stop Button */}
              <button
                onClick={handleStop}
                disabled={tts.playbackState === 'idle'}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-rose-400 border border-slate-700 transition-all"
                title={t('tts.stop', 'Stop')}
              >
                <Square className="w-4 h-4 fill-current" />
              </button>

              {/* Skip Prev Paragraph */}
              <button
                onClick={handlePrevParagraph}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
                title={tr('પાછલો ફકરો', 'Previous Paragraph', 'पिछला अनुच्छेद')}
              >
                <SkipBack className="w-4 h-4" />
              </button>

              {/* Skip Next Paragraph */}
              <button
                onClick={handleNextParagraph}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
                title={tr('આગલો ફકરો', 'Next Paragraph', 'अगला अनुच्छेद')}
              >
                <SkipForward className="w-4 h-4" />
              </button>

              {/* Active Reading Status Indicator */}
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700/80">
                <div className="flex items-end space-x-0.5 h-3">
                  <span
                    className={`w-0.5 bg-blue-400 rounded-full transition-all ${
                      tts.playbackState === 'playing' ? 'h-3 animate-pulse' : 'h-1'
                    }`}
                  />
                  <span
                    className={`w-0.5 bg-blue-400 rounded-full transition-all ${
                      tts.playbackState === 'playing' ? 'h-2 animate-pulse delay-75' : 'h-1'
                    }`}
                  />
                  <span
                    className={`w-0.5 bg-blue-400 rounded-full transition-all ${
                      tts.playbackState === 'playing' ? 'h-3.5 animate-pulse delay-150' : 'h-1'
                    }`}
                  />
                </div>
                <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-300">
                  <span>
                    {tts.playbackState === 'playing'
                      ? `${tr('વાંચી રહ્યું છે:', 'Reading:', 'पढ़ रहा है:')} ${tr('પાનું', 'Page', 'पृष्ठ')} ${currentPageIdx + 1} • #${(activeParagraphIdx ?? 0) + 1}`
                      : tts.playbackState === 'paused'
                      ? t('tts.paused', 'Paused')
                      : tr('વાચન માટે તૈયાર', 'Ready to Read', 'वाचन के लिए तैयार')}
                  </span>

                  {/* Active speech language tag */}
                  {tts.playbackState === 'playing' && currentActiveParagraphLanguage && (
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border uppercase inline-flex items-center space-x-1 ${
                        currentActiveParagraphLanguage === 'gu'
                          ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                          : currentActiveParagraphLanguage === 'hi'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      }`}
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>
                        {currentActiveParagraphLanguage === 'gu'
                          ? 'ગુજરાતી HD'
                          : currentActiveParagraphLanguage === 'hi'
                          ? 'हिन्दी HD'
                          : 'English'}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Secondary Controls: Language Selector, Speed, Auto-advance, Voice */}
            <div className="flex items-center space-x-2.5 flex-wrap">
              {/* Language Selector Segmented Buttons */}
              <div className="inline-flex items-center bg-slate-800/90 rounded-xl p-0.5 border border-slate-700 text-xs shadow-inner">
                <button
                  onClick={() => setSelectedLanguage('auto')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center space-x-1 ${
                    selectedLanguage === 'auto'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={tr(
                    'આપમેળે ભાષા ઓળખો (ગુજરાતી, હિન્દી, અંગ્રેજી)',
                    'Auto-detect Language (Gujarati, Hindi, English)',
                    'स्वचालित भाषा पहचान (गुजराती, हिन्दी, अंग्रेज़ी)'
                  )}
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Auto</span>
                </button>

                <button
                  onClick={() => setSelectedLanguage('gu')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center space-x-1 ${
                    selectedLanguage === 'gu'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-teal-300'
                  }`}
                  title={tr('ગુજરાતી અવાજ સેટ કરો', 'Force Gujarati Language', 'गुजराती भाषा सेट करें')}
                >
                  <span>ગુજરાતી</span>
                </button>

                <button
                  onClick={() => setSelectedLanguage('hi')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center space-x-1 ${
                    selectedLanguage === 'hi'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-amber-300'
                  }`}
                  title={tr('હિન્દી અવાજ સેટ કરો', 'Force Hindi Language', 'हिन्दी भाषा सेट करें')}
                >
                  <span>हिन्दी</span>
                </button>

                <button
                  onClick={() => setSelectedLanguage('en')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center space-x-1 ${
                    selectedLanguage === 'en'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-blue-300'
                  }`}
                  title={tr('અંગ્રેજી અવાજ સેટ કરો', 'Force English Language', 'अंग्रेज़ी भाषा सेट करें')}
                >
                  <span>EN</span>
                </button>
              </div>

              {/* Auto Advance Toggle */}
              <label className="flex items-center space-x-1.5 text-[11px] text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoAdvance}
                  onChange={(e) => setAutoAdvance(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0 focus:outline-none w-3.5 h-3.5"
                />
                <span>{tr('ઓટો આગળ વધો', 'Auto-advance', 'ऑटो आगे बढ़ें')}</span>
              </label>

              {/* Speed Adjustment */}
              <div className="inline-flex items-center space-x-1 bg-slate-800/80 rounded-xl p-1 border border-slate-700 text-xs">
                <Gauge className="w-3 h-3 text-slate-400 ml-1" />
                {speedOptions.map((s) => (
                  <button
                    key={s}
                    onClick={() => tts.setRate(s)}
                    className={`px-1.5 py-0.5 rounded-lg text-[10px] transition-all font-medium ${
                      tts.rate === s
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              {/* Voice Picker Dropdown with Language Filter Tabs */}
              {tts.voices.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowVoiceSettings((prev) => !prev)}
                    className={`p-1.5 px-2.5 rounded-xl border transition-all text-xs flex items-center space-x-1.5 ${
                      showVoiceSettings || tts.selectedVoice
                        ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                    title={t('tts.voice', 'Voice Settings')}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span className="text-[11px]">
                      {tts.selectedVoice
                        ? tts.selectedVoice.name.split(' ')[0]
                        : t('tts.voice', 'Voice')}
                    </span>
                  </button>

                  {showVoiceSettings && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3.5 z-50 space-y-2.5 backdrop-blur-md">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-200 border-b border-slate-800 pb-2">
                        <span className="flex items-center space-x-1.5">
                          <Settings2 className="w-3.5 h-3.5 text-blue-400" />
                          <span>{t('tts.voice', 'Voice Selection')}</span>
                        </span>
                        <button
                          onClick={() => setShowVoiceSettings(false)}
                          className="text-slate-400 hover:text-white text-xs px-1"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Language Filter Tabs */}
                      <div className="flex items-center justify-between p-1 bg-slate-800/90 rounded-xl text-[10px]">
                        <button
                          onClick={() => setVoiceFilterLang('all')}
                          className={`px-2 py-1 rounded-lg transition-all ${
                            voiceFilterLang === 'all'
                              ? 'bg-blue-600 text-white font-bold'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          All ({tts.voices.length})
                        </button>
                        <button
                          onClick={() => setVoiceFilterLang('gu')}
                          className={`px-2 py-1 rounded-lg transition-all ${
                            voiceFilterLang === 'gu'
                              ? 'bg-teal-600 text-white font-bold'
                              : 'text-slate-400 hover:text-teal-300'
                          }`}
                        >
                          ગુજરાતી ({gujaratiVoices.length})
                        </button>
                        <button
                          onClick={() => setVoiceFilterLang('hi')}
                          className={`px-2 py-1 rounded-lg transition-all ${
                            voiceFilterLang === 'hi'
                              ? 'bg-amber-600 text-white font-bold'
                              : 'text-slate-400 hover:text-amber-300'
                          }`}
                        >
                          हिन्दी ({hindiVoices.length})
                        </button>
                        <button
                          onClick={() => setVoiceFilterLang('en')}
                          className={`px-2 py-1 rounded-lg transition-all ${
                            voiceFilterLang === 'en'
                              ? 'bg-blue-600 text-white font-bold'
                              : 'text-slate-400 hover:text-blue-300'
                          }`}
                        >
                          EN ({englishVoices.length})
                        </button>
                      </div>

                      {/* Fallback Notice if no Gujarati/Hindi voices installed */}
                      {voiceFilterLang === 'gu' && gujaratiVoices.length === 0 && (
                        <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-[10px] text-teal-300 space-y-1">
                          <p className="font-bold">
                            {tr(
                              '💡 સ્વચાલિત ભારતીય ઉચ્ચારણ સક્રિય',
                              '💡 Indic Phonetic Fallback Active',
                              '💡 स्वचालित भारतीय उच्चारण सक्रिय'
                            )}
                          </p>
                          <p className="text-slate-400 leading-relaxed">
                            {tr(
                              'તમારા સિસ્ટમમાં સીધો ગુજરાતી વૉઇસ પૅક ન હોય ત્યારે પણ, સિસ્ટમ ભારતીય ઉચ્ચારણ એન્જિન દ્વારા સ્પષ્ટ ગુજરાતી અવાજ આપશે.',
                              'Even if no standalone Gujarati voice pack is installed, Web Speech synthesizes clear Gujarati speech using the Indian engine.',
                              'सिस्टम में सीधा गुजराती वॉइस पैक न होने पर भी भारतीय स्पीच इंजन से स्पष्ट गुजराती वाचन होगा।'
                            )}
                          </p>
                        </div>
                      )}

                      {voiceFilterLang === 'hi' && hindiVoices.length === 0 && (
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 space-y-1">
                          <p className="font-bold">
                            {tr(
                              '💡 સ્વચાલિત હિન્દી ઉચ્ચારણ સક્રિય',
                              '💡 Indic Speech Engine Active',
                              '💡 स्वचालित हिन्दी उच्चारण सक्रिय'
                            )}
                          </p>
                          <p className="text-slate-400 leading-relaxed">
                            {tr(
                              'સિસ્ટમ ભારતીય ઉચ્ચારણ એન્જિન દ્વારા સ્પષ્ટ હિન્દી અવાજ આપશે.',
                              'Web Speech synthesizes clear Hindi phonetics using the browser speech engine.',
                              'सिस्टम भारतीय स्पीच इंजन द्वारा स्पष्ट हिन्दी आवाज़ प्रदान करेगा।'
                            )}
                          </p>
                        </div>
                      )}

                      {/* Voices List */}
                      <div className="max-h-48 overflow-y-auto space-y-1 pr-1 text-left">
                        <button
                          onClick={() => {
                            tts.setSelectedVoice(null);
                            setShowVoiceSettings(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl text-[11px] transition-all flex items-center justify-between ${
                            tts.selectedVoice === null
                              ? 'bg-blue-600 text-white font-bold'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <span>✨ {tr('સ્વચાલિત શ્રેષ્ઠ અવાજ', 'Auto Optimal Voice', 'स्वचालित सर्वोत्तम आवाज़')}</span>
                          <span className="text-[9px] uppercase px-1 py-0.5 bg-slate-800/80 rounded text-slate-300">
                            AUTO
                          </span>
                        </button>

                        {displayedVoices.map((v, i) => (
                          <button
                            key={`${v.name}-${i}`}
                            onClick={() => {
                              tts.setSelectedVoice(v);
                              setShowVoiceSettings(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-xl text-[11px] transition-all truncate flex items-center justify-between ${
                              tts.selectedVoice?.name === v.name
                                ? 'bg-blue-600 text-white font-bold'
                                : 'text-slate-300 hover:bg-slate-800'
                            }`}
                            title={`${v.name} (${v.lang})`}
                          >
                            <span className="truncate max-w-[190px]">{v.name}</span>
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
          </div>

          {/* Document Paragraphs Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <h4 className="font-bold text-white text-sm">
                  {tr('પાનાનું લખાણ', 'Page Content', 'पृष्ठ सामग्री')} ({tr('પાનું', 'Page', 'पृष्ठ')} {currentPageIdx + 1} / {extractedPdf.numPages})
                </h4>
              </div>
              <span className="text-xs text-slate-400">
                {currentPage?.paragraphs.length || 0} {tr('ફકરાઓ', 'Paragraphs', 'अनुच्छेद')}
              </span>
            </div>

            {/* Paragraph Cards with Language Badges */}
            <div className="space-y-3">
              {currentPage?.paragraphs.map((paraText, pIdx) => {
                const isActive = isReadingCurrentPage && activeParagraphIdx === pIdx;
                const detected = detectScriptLanguage(paraText);
                const isGu = detected === 'gu';
                const isHi = detected === 'hi';

                return (
                  <div
                    key={pIdx}
                    ref={(el) => (paragraphRefs.current[pIdx] = el)}
                    onClick={() => playParagraph(currentPageIdx, pIdx)}
                    className={`p-4 rounded-2xl transition-all duration-300 cursor-pointer border relative group ${
                      isActive
                        ? 'bg-slate-800/95 border-blue-500 ring-2 ring-blue-500/50 shadow-xl shadow-blue-500/10 text-white'
                        : 'bg-slate-800/40 hover:bg-slate-800/80 border-slate-700/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3">
                        <div className="flex flex-col items-center space-y-1 shrink-0 mt-0.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                              isActive
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-800 text-slate-500 group-hover:text-slate-300'
                            }`}
                          >
                            #{pIdx + 1}
                          </span>

                          {/* Language Badge */}
                          <span
                            className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${
                              isGu
                                ? 'bg-teal-500/10 text-teal-300 border-teal-500/30'
                                : isHi
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                            }`}
                          >
                            {isGu ? 'ગુજરાતી' : isHi ? 'हिन्दी' : 'English'}
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap pt-0.5">
                          {paraText}
                        </p>
                      </div>

                      {/* Paragraph Play Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playParagraph(currentPageIdx, pIdx);
                        }}
                        className={`p-2 rounded-xl transition-all shrink-0 ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-slate-800/80 group-hover:bg-blue-600 text-slate-400 group-hover:text-white'
                        }`}
                        title={tr('આ ફકરો સાંભળો', 'Listen to this paragraph', 'यह अनुच्छेद सुनें')}
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    {isActive && (
                      <div className="mt-2 pt-2 border-t border-blue-500/30 flex items-center justify-between text-[11px] text-blue-300 font-semibold">
                        <span className="flex items-center space-x-1.5">
                          <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                          <span>
                            {tr(
                              'હાલમાં વંચાઈ રહ્યું છે...',
                              'Currently being read aloud...',
                              'वर्तमान में पढ़ा जा रहा है...'
                            )}
                          </span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {tr('ક્લિક કરીને ફરીથી સાંભળો', 'Click to replay', 'पुनः सुनने के लिए क्लिक करें')}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Page Navigation */}
            {extractedPdf.numPages > 1 && (
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => {
                    tts.stop();
                    setActiveParagraphIdx(null);
                    setCurrentPageIdx((prev) => Math.max(0, prev - 1));
                  }}
                  disabled={currentPageIdx === 0}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-semibold transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{tr('પાછલું પાનું', 'Previous Page', 'पिछला पृष्ठ')}</span>
                </button>

                <span className="text-xs text-slate-400 font-medium">
                  {tr('પાનું', 'Page', 'पृष्ठ')} {currentPageIdx + 1} {tr('માંથી', 'of', 'में से')} {extractedPdf.numPages}
                </span>

                <button
                  onClick={() => {
                    tts.stop();
                    setActiveParagraphIdx(null);
                    setCurrentPageIdx((prev) => Math.min(extractedPdf.numPages - 1, prev + 1));
                  }}
                  disabled={currentPageIdx === extractedPdf.numPages - 1}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-semibold transition-all"
                >
                  <span>{tr('આગલું પાનું', 'Next Page', 'अगला पृष्ठ')}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
