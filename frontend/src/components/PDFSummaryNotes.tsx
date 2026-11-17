import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sparkles,
  FileText,
  UploadCloud,
  CheckCircle2,
  Download,
  Copy,
  Check,
  Printer,
  Volume2,
  Play,
  Pause,
  Square,
  BookOpen,
  HelpCircle,
  Lightbulb,
  Sliders,
  Languages,
  FileCheck,
  RefreshCw,
  Trash2,
  AlertCircle,
  ChevronRight,
  BookmarkCheck,
  FileSpreadsheet
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { tr } from '../utils/tr';
import { extractTextFromPdf, ExtractedPdf } from '../utils/pdfExtractor';
import { useTextToSpeech, detectScriptLanguage } from '../hooks/useTextToSpeech';
import api from '../services/api';

export type OutputLanguageMode = 'auto' | 'gu' | 'hi' | 'en';
export type DetailLevel = 'quick' | 'standard' | 'comprehensive';
export type ActiveResultTab = 'summary' | 'notes' | 'terms' | 'qna' | 'formulas';

interface SummarizedSection {
  heading: string;
  points: string[];
}

interface KeyTermItem {
  term: string;
  definition: string;
}

interface ExamQnAItem {
  question: string;
  answer: string;
  importance?: 'High' | 'Medium';
}

interface PdfSummaryData {
  title: string;
  language: 'gu' | 'hi' | 'en';
  overview: string;
  keyTakeaways: string[];
  structuredNotes: SummarizedSection[];
  keyTerms: KeyTermItem[];
  importantFormulasOrRules: string[];
  examQuestions: ExamQnAItem[];
  speechSummary: string;
  source?: 'gemini' | 'curriculum_nlp';
}

const SAMPLE_STUDY_PRESETS = [
  {
    id: 'gu-force',
    title: 'ગુજરાતી: બળ અને દબાણ (પ્રકરણ ૧૧)',
    subject: 'ધોરણ ૮ વિજ્ઞાન',
    flag: '🇮🇳',
    text: `વિજ્ઞાન પ્રકરણ ૧૧: બળ અને દબાણ.
કોઈપણ પદાર્થને ગતિમાં લાવવા અથવા તેની ગતિની દિશા બદલવા માટે બળ જરૂરી છે. બળ એ કોઈ વસ્તુ પર થતો ધક્કો કે ખેંચાણ છે. જ્યારે બે પદાર્થો વચ્ચે પરસ્પર આંતરક્રિયા થાય છે ત્યારે જ બળ ઉદ્ભવે છે.
બળના બે મુખ્ય પ્રકારો છે: સંપર્ક બળો અને અસંપર્ક બળો.
૧. સ્નાયુ બળ: આપણા શરીરના સ્નાયુઓની ક્રિયા દ્વારા લાગતા બળને સ્નાયુ બળ કહે છે.
૨. ઘર્ષણ બળ: ગતિની વિરુદ્ધ દિશામાં સપાટી દ્વારા લાગતા બળને ઘર્ષણ બળ કહેવાય છે.
૩. અસંપર્ક બળોમાં ગુરુત્વાકર્ષણ બળ અને ચુંબકીય બળનો સમાવેશ થાય છે.
દબાણ એટલે એકમ ક્ષેત્રફળ દીઠ સપાટી પર લંબરૂપે લાગતું બળ. દબાણનું સૂત્ર: દબાણ = બળ / ક્ષેત્રફળ. દબાણનો SI એકમ પાસ્કલ (Pa) અથવા ન્યૂટન પ્રતિ ચોરસ મીટર (N/m²) છે.
પ્રવાહી અને વાયુઓ પણ પાત્રની દીવાલો પર દબાણ કરે છે. પૃથ્વીની આસપાસ રહેલી હવાના આવરણ દ્વારા લાગતા દબાણને વાતાવરણનું દબાણ કહેવામાં આવે છે.`
  },
  {
    id: 'hi-force',
    title: 'हिन्दी: बल तथा दाब (अध्याय ११)',
    subject: 'कक्षा ८ विज्ञान',
    flag: '🇮🇳',
    text: `विज्ञान अध्याय ११: बल तथा दाब।
किसी वस्तु पर लगने वाले धक्के (अभिकर्षण) या खिंचाव (अपकर्षण) को बल कहते हैं। दो वस्तुओं के बीच अन्योन्यक्रिया के कारण बल कार्य करता है। बल किसी स्थिर वस्तु को गतिशील कर सकता है तथा उसकी गति की दिशा बदल सकता है।
सम्पर्क बल: जब बल लगाने के लिए वस्तु से सीधा भौतिक सम्पर्क आवश्यक हो, जैसे पेशीय बल तथा घर्षण बल।
असम्पर्क बल: जो बल बिना किसी भौतिक सम्पर्क के दूर से कार्य करते हैं, उन्हें असम्पर्क बल कहते हैं; जैसे गुरुत्वाकर्षण बल तथा चुम्बकीय बल।
दाब: किसी पृष्ठ के प्रति एकांक क्षेत्रफल पर लगने वाले लंबवत बल को दाब कहते हैं।
दाब का सूत्र: दाब = बल / क्षेत्रफल। दाब का अंतर्राष्ट्रीय मात्रक पास्कल (Pa) अथवा न्यूटन प्रति वर्ग मीटर है।
द्रव तथा गैसें भी बर्तन की दीवारों पर दाब डालते हैं। गहराई बढ़ने के साथ द्रव का दाब भी बढ़ जाता है।
वायुमंडलीय दाब: हमारे चारों ओर उपस्थित वायुमण्डल द्वारा पृथ्वी की सतह पर लगाए गए दाब को वायुमंडलीय दाब कहते हैं।`
  },
  {
    id: 'en-force',
    title: 'English: Force and Pressure (Chapter 11)',
    subject: 'Grade 8 Science',
    flag: '🇬🇧',
    text: `Science Chapter 11: Force and Pressure.
A force is a push or pull upon an object resulting from its interaction with another object. Forces can change the state of motion of an object and can also change its shape.
Forces are broadly classified into Contact Forces and Non-contact Forces:
1. Contact forces require physical interaction, such as muscular force and friction. Friction always opposes the relative motion between two surfaces in contact.
2. Non-contact forces act from a distance without physical contact, including gravitational force, electrostatic force, and magnetic force.
Pressure is defined as the force acting perpendicularly on a unit surface area.
Formula: Pressure = Force / Area. The SI unit of pressure is Pascal (Pa) or Newton per square meter (N/m²).
Liquids and gases also exert pressure on the walls of their container. The pressure exerted by the envelope of air surrounding the Earth is known as Atmospheric Pressure.`
  }
];

export const PDFSummaryNotes: React.FC = () => {
  const { t } = useTranslation(['ai', 'common']);
  const tts = useTextToSpeech();

  // Document input state
  const [extractedPdf, setExtractedPdf] = useState<ExtractedPdf | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [extractingPdf, setExtractingPdf] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Generation options
  const [outputLanguage, setOutputLanguage] = useState<OutputLanguageMode>('auto');
  const [detailLevel, setDetailLevel] = useState<DetailLevel>('standard');
  const [generating, setGenerating] = useState<boolean>(false);
  const [summaryData, setSummaryData] = useState<PdfSummaryData | null>(null);

  // View state
  const [activeTab, setActiveTab] = useState<ActiveResultTab>('summary');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop TTS on unmount
  useEffect(() => {
    return () => {
      tts.stop();
    };
  }, []);

  // Effective text to summarize
  const activeDocumentText = useMemo(() => {
    if (extractedPdf) {
      return extractedPdf.pages.map((p) => p.text).join('\n\n');
    }
    return rawText;
  }, [extractedPdf, rawText]);

  // Detected language of document
  const detectedDocLang = useMemo(() => {
    return detectScriptLanguage(activeDocumentText);
  }, [activeDocumentText]);

  // Handle PDF file upload
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError(tr('કૃપા કરીને ફક્ત પીડીએફ (.pdf) ફાઇલ પસંદ કરો.', 'Please select a valid PDF document (.pdf).', 'कृपया केवल पीडीएफ फाइल चुनें।'));
      return;
    }

    setExtractingPdf(true);
    setUploadError(null);
    setSummaryData(null);
    tts.stop();

    try {
      const data = await extractTextFromPdf(file);
      setExtractedPdf(data);
      setFileName(data.fileName);
      const extractedContent = data.pages.map((p) => p.text).join('\n\n').trim();
      setRawText(extractedContent);

      if (!extractedContent || data.totalWords === 0) {
        setUploadError(
          tr(
            'આ પીડીએફમાંથી કોઈ વાંચવા યોગ્ય લખાણ મળ્યું નથી. જો આ સ્કેન કરેલી ઇમેજ પીડીએફ હોય, તો કૃપા કરીને ટેક્સ્ટ-આધારિત પીડીએફ વાપરો અથવા સીધું લખાણ પેસ્ટ કરો.',
            'No readable text could be extracted from this PDF. If this is a scanned image or protected PDF, please use a digital text PDF or paste the text directly.',
            'इस पीडीएफ से कोई पाठ नहीं निकाला जा सका। यदि यह स्कैन की गई छवि है, तो कृपया टेक्स्ट-आधारित पीडीएफ का उपयोग करें या सीधे पाठ पेस्ट करें।'
          )
        );
      } else {
        const detected = detectScriptLanguage(extractedContent);
        if (detected === 'gu') {
          setOutputLanguage('gu');
        } else if (detected === 'hi') {
          setOutputLanguage('hi');
        }
      }
    } catch (err: any) {
      console.error('PDF extraction failed:', err);
      setUploadError(
        tr(
          'પીડીએફમાંથી લખાણ મેળવવામાં ભૂલ આવી. કૃપા કરીને અન્ય ફાઇલ અજમાવો.',
          'Failed to extract text from this PDF. It may be password-protected or image-only.',
          'पीडीएफ से पाठ निकालने में त्रुटि हुई। कृपया अन्य फाइल का प्रयास करें।'
        )
      );
    } finally {
      setExtractingPdf(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Load a demo study preset
  const handleLoadPreset = (preset: typeof SAMPLE_STUDY_PRESETS[0]) => {
    tts.stop();
    setExtractedPdf(null);
    setFileName(preset.title);
    setRawText(preset.text);
    setSummaryData(null);
    setUploadError(null);
  };

  // Clear loaded document
  const handleResetDocument = () => {
    tts.stop();
    setExtractedPdf(null);
    setRawText('');
    setFileName('');
    setSummaryData(null);
    setUploadError(null);
  };

  // Trigger Summary & Notes Generation
  const handleGenerateSummary = async () => {
    if (!activeDocumentText.trim()) return;

    setGenerating(true);
    setUploadError(null);
    tts.stop();

    const targetLang = outputLanguage === 'auto' ? detectedDocLang : outputLanguage;

    try {
      const response = await api.post('/ai/summarize-pdf', {
        text: activeDocumentText,
        fileName: fileName || 'Study_Document.pdf',
        language: targetLang,
        detailLevel,
        includeQnA: true,
        includeGlossary: true
      });

      if (response.data && response.data.summary) {
        setSummaryData(response.data.summary);
        setActiveTab('summary');
      } else {
        throw new Error('Invalid summary response payload');
      }
    } catch (err: any) {
      console.error('Failed to generate summary:', err);
      setUploadError(
        tr(
          'સારાંશ બનાવવામાં તકલીફ પડી. કૃપા કરીને ફરી પ્રયાસ કરો.',
          'Failed to generate summary and notes. Please try again.',
          'सारांश बनाने में विफल। कृपया पुनः प्रयास करें।'
        )
      );
    } finally {
      setGenerating(false);
    }
  };

  // Audio readout handlers
  const handlePlayAudio = (textToSpeak: string, id: string) => {
    if (!textToSpeak) return;
    const langToUse = summaryData?.language || detectedDocLang || 'gu';
    tts.speak(id, textToSpeak, langToUse);
  };

  const isAudioPlaying = tts.playbackState === 'playing';
  const isAudioPaused = tts.playbackState === 'paused';

  // Copy helper
  const handleCopy = async (content: string, key: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  // Download notes as text/markdown
  const handleDownloadNotes = () => {
    if (!summaryData) return;

    let markdown = `# ${summaryData.title}\n\n`;
    markdown += `## ${tr('મુખ્ય સારાંશ (Executive Overview)', 'Executive Overview', 'मुख्य सारांश')}\n`;
    markdown += `${summaryData.overview}\n\n`;

    markdown += `## ${tr('મહત્વપૂર્ણ મુદ્દાઓ (Key Takeaways)', 'Key Takeaways', 'महत्वपूर्ण बिंदु')}\n`;
    summaryData.keyTakeaways.forEach((pt, i) => {
      markdown += `${i + 1}. ${pt}\n`;
    });
    markdown += `\n`;

    if (summaryData.structuredNotes?.length > 0) {
      markdown += `## ${tr('વિષયવાર રિવિઝન નોંધો (Revision Notes)', 'Revision Notes', 'रिवीजन नोट्स')}\n`;
      summaryData.structuredNotes.forEach((sec) => {
        markdown += `### ${sec.heading}\n`;
        sec.points.forEach((p) => {
          markdown += `- ${p}\n`;
        });
        markdown += `\n`;
      });
    }

    if (summaryData.keyTerms?.length > 0) {
      markdown += `## ${tr('વ્યાખ્યાઓ અને શબ્દાવલી (Definitions)', 'Definitions & Key Terms', 'शब्दावली')}\n`;
      summaryData.keyTerms.forEach((kt) => {
        markdown += `- **${kt.term}**: ${kt.definition}\n`;
      });
      markdown += `\n`;
    }

    if (summaryData.importantFormulasOrRules?.length > 0) {
      markdown += `## ${tr('સૂત્રો અને નિયમો (Formulas & Rules)', 'Formulas & Scientific Laws', 'सूत्र एवं नियम')}\n`;
      summaryData.importantFormulasOrRules.forEach((f) => {
        markdown += `- ${f}\n`;
      });
      markdown += `\n`;
    }

    if (summaryData.examQuestions?.length > 0) {
      markdown += `## ${tr('પરીક્ષાલક્ષી પ્રશ્નોત્તરી (Exam Q&A)', 'Exam Practice Q&A', 'परीक्षा प्रश्नोत्तरी')}\n`;
      summaryData.examQuestions.forEach((q, i) => {
        markdown += `**Q${i + 1}: ${q.question}**\n*Ans:* ${q.answer}\n\n`;
      });
    }

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${summaryData.title.replace(/\s+/g, '_')}_Notes.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Upload or Choose Document Card */}
      {!summaryData && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/30">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {tr(
                    'પીડીએફ અપલોડ કરો અને સ્માર્ટ સારાંશ મેળવો',
                    'Upload PDF for AI Summaries & Revision Notes',
                    'पीडीएफ अपलोड करें और स्मार्ट सारांश व नोट्स बनाएं'
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {tr(
                    'પાઠ્યપુસ્તકો, સંદર્ભ સામગ્રી કે નોંધોમાંથી આપમેળે મુખ્ય મુદ્દા, વ્યાખ્યાઓ અને પરીક્ષા પ્રશ્નો બનાવો.',
                    'Automatically extract core takeaways, definitions, formula sheets, and exam Q&A from study materials.',
                    'पाठ्यपुस्तकों या नोट्स से स्वचालित रूप से मुख्य बिंदु, परिभाषाएं और परीक्षा प्रश्नोत्तरी बनाएं।'
                  )}
                </p>
              </div>
            </div>

            {rawText && (
              <button
                onClick={handleResetDocument}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/30 border border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 text-xs font-semibold transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{tr('બદલો / સાફ કરો', 'Change / Reset', 'बदलें / साफ़ करें')}</span>
              </button>
            )}
          </div>

          {/* Upload / Drag and Drop Area */}
          {!rawText ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-indigo-500/40 hover:border-indigo-400 bg-slate-800/30 hover:bg-slate-800/60 rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4 cursor-pointer group transition-all"
            >
              <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <p className="text-sm sm:text-base font-bold text-white">
                  {tr('પીડીએફ ફાઇલ અહીં ડ્રેગ કરો અથવા બ્રાઉઝ કરો', 'Drag & drop study PDF here, or click to browse', 'पीडीएफ फाइल यहाँ खींचें या ब्राउज़ करें')}
                </p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {tr(
                    'ગુજરાતી, હિન્દી અને અંગ્રેજી પાઠ્યપુસ્તકો અને અસાઇનમેન્ટ્સ સપોર્ટેડ છે.',
                    'Supports Gujarati, Hindi, and English textbooks, worksheets, and assignments.',
                    'गुजराती, हिन्दी और अंग्रेज़ी पाठ्यपुस्तकें और असाइनमेंट समर्थित हैं।'
                  )}
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
              />
            </div>
          ) : (
            /* Document Loaded Preview Card */
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white truncate max-w-sm">
                      {fileName || 'Study_Document.pdf'}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-2">
                      <span>
                        {extractedPdf ? `${extractedPdf.numPages} ${tr('પાના', 'Pages', 'पृष्ठ')}` : `${rawText.length} ${tr('અક્ષરો', 'Characters', 'अक्षर')}`}
                      </span>
                      <span>•</span>
                      <span className="text-indigo-400 font-semibold">
                        {detectedDocLang === 'gu' ? '🇮🇳 ગુજરાતી' : detectedDocLang === 'hi' ? '🇮🇳 हिन्दी' : '🇬🇧 English'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{tr('લખાણ તૈયાર છે', 'Text Extracted Ready', 'पाठ तैयार है')}</span>
                </div>
              </div>

              {/* Text Snippet Preview */}
              <div className="bg-slate-900/90 rounded-xl p-3 text-xs text-slate-300 font-mono max-h-36 overflow-y-auto leading-relaxed border border-slate-800/80">
                {rawText.slice(0, 500)}...
              </div>
            </div>
          )}

          {extractingPdf && (
            <div className="flex items-center justify-center space-x-3 py-4 text-indigo-400 text-xs font-semibold">
              <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <span>{tr('પીડીએફમાંથી લખાણ વાંચવામાં આવી રહ્યું છે...', 'Extracting PDF text...', 'पीडीएफ से पाठ निकाला जा रहा है...')}</span>
            </div>
          )}

          {uploadError && (
            <div className="flex items-center space-x-2 text-rose-400 text-xs font-semibold bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-2xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Quick Study Samples */}
          {!rawText && (
            <div className="space-y-2 pt-2">
              <span className="text-xs text-slate-400 font-semibold">
                {tr('અથવા નમૂના પાઠ સાથે સીધો ટેસ્ટ કરો:', 'Or try with a sample curriculum chapter:', 'या नमूना पाठ के साथ तुरंत परीक्षण करें:')}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {SAMPLE_STUDY_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleLoadPreset(preset)}
                    className="p-3 text-left rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/40 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base">{preset.flag}</span>
                      <span className="text-[10px] text-slate-400 group-hover:text-indigo-300">{preset.subject}</span>
                    </div>
                    <p className="text-xs font-bold text-white group-hover:text-indigo-200 transition-colors truncate">
                      {preset.title}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Generation Settings Controls */}
          {rawText && (
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Language Option */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                    <Languages className="w-4 h-4 text-purple-400" />
                    <span>{tr('સારાંશ ભાષા', 'Summary Output Language', 'सारांश की भाषा')}</span>
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setOutputLanguage('auto')}
                      className={`py-2 px-1 rounded-lg font-semibold transition-all ${
                        outputLanguage === 'auto'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tr('ઓટો', 'Auto', 'ऑटो')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOutputLanguage('gu')}
                      className={`py-2 px-1 rounded-lg font-semibold transition-all ${
                        outputLanguage === 'gu'
                          ? 'bg-teal-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      ગુજરાતી
                    </button>
                    <button
                      type="button"
                      onClick={() => setOutputLanguage('hi')}
                      className={`py-2 px-1 rounded-lg font-semibold transition-all ${
                        outputLanguage === 'hi'
                          ? 'bg-amber-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      हिन्दी
                    </button>
                    <button
                      type="button"
                      onClick={() => setOutputLanguage('en')}
                      className={`py-2 px-1 rounded-lg font-semibold transition-all ${
                        outputLanguage === 'en'
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      English
                    </button>
                  </div>
                </div>

                {/* Detail Level */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <span>{tr('નોંધનું સ્વરૂપ / ઊંડાણ', 'Note Detail Level', 'नोट्स का स्तर')}</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setDetailLevel('quick')}
                      className={`py-2 px-1 rounded-lg font-semibold transition-all ${
                        detailLevel === 'quick'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title={tr('ઝડપી પુનરાવર્તન', 'Quick Revision', 'त्वरित पुनरीक्षण')}
                    >
                      ⚡ {tr('ઝડપી', 'Quick', 'त्वरित')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailLevel('standard')}
                      className={`py-2 px-1 rounded-lg font-semibold transition-all ${
                        detailLevel === 'standard'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title={tr('સંતુલિત અભ્યાસ', 'Standard Revision', 'संतुलित')}
                    >
                      ⚖️ {tr('સંતુલિત', 'Standard', 'मानक')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailLevel('comprehensive')}
                      className={`py-2 px-1 rounded-lg font-semibold transition-all ${
                        detailLevel === 'comprehensive'
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title={tr('વિસ્તૃત નોટ્સ', 'Detailed Notes', 'विस्तृत')}
                    >
                      📚 {tr('વિસ્તૃત', 'Detailed', 'विस्तृत')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Generate Action Button */}
              <div className="pt-2">
                <button
                  onClick={handleGenerateSummary}
                  disabled={generating}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm sm:text-base shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center space-x-2.5 disabled:opacity-50 cursor-pointer"
                >
                  {generating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{tr('AI સારાંશ અને નોટ્સ તૈયાર થઈ રહી છે...', 'Generating AI Summary & Notes...', 'एआई सारांश तैयार हो रहा है...')}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 animate-pulse" />
                      <span>{tr('AI સારાંશ અને નોટ્સ બનાવો', 'Generate AI Summary & Notes', 'एआई सारांश और नोट्स बनाएं')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Generated Results Hub */}
      {summaryData && (
        <div className="space-y-5">
          {/* Header Bar: Title, Reset & Export Actions */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {summaryData.source === 'gemini' ? '✨ Gemini AI' : '⚡ Curriculum Engine'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {summaryData.language === 'gu' ? '🇮🇳 ગુજરાતી' : summaryData.language === 'hi' ? '🇮🇳 हिन्दी' : '🇬🇧 English'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white truncate max-w-xl">
                {summaryData.title}
              </h2>
            </div>

            {/* Action Tools */}
            <div className="flex items-center space-x-2 flex-wrap">
              {/* TTS Listen Button */}
              {!isAudioPlaying && !isAudioPaused ? (
                <button
                  onClick={() => handlePlayAudio(summaryData.speechSummary || summaryData.overview, 'summary-speech')}
                  className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all"
                  title={tr('સારાંશ સાંભળો', 'Listen to Summary aloud', 'सारांश सुनें')}
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{tr('સારાંશ સાંભળો', 'Listen to Summary', 'सारांश सुनें')}</span>
                </button>
              ) : (
                <div className="inline-flex items-center space-x-1.5">
                  {isAudioPlaying ? (
                    <button
                      onClick={tts.pause}
                      className="inline-flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>{tr('થોભો', 'Pause', 'रोकें')}</span>
                    </button>
                  ) : (
                    <button
                      onClick={tts.resume}
                      className="inline-flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{tr('ચાલુ રાખો', 'Resume', 'जारी रखें')}</span>
                    </button>
                  )}
                  <button
                    onClick={tts.stop}
                    className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs"
                    title={tr('બંધ કરો', 'Stop', 'बंद करें')}
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              )}

              {/* Download Notes */}
              <button
                onClick={handleDownloadNotes}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs border border-slate-700 transition-all"
                title={tr('નોંધો ડાઉનલોડ કરો', 'Download Markdown / Notes', 'नोट्स डाउनलोड करें')}
              >
                <Download className="w-3.5 h-3.5" />
                <span>{tr('ડાઉનલોડ', 'Download', 'डाउनलोड')}</span>
              </button>

              {/* Print */}
              <button
                onClick={handlePrint}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
                title={tr('પ્રિન્ટ કરો', 'Print Notes', 'प्रिंट करें')}
              >
                <Printer className="w-4 h-4" />
              </button>

              {/* Reset to New */}
              <button
                onClick={handleResetDocument}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-indigo-900/30 text-indigo-300 font-semibold text-xs border border-slate-700 hover:border-indigo-500/40 transition-all"
                title={tr('નવી ફાઇલ માટે સારાંશ બનાવો', 'Summarize another PDF', 'नई फाइल चुनें')}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{tr('નવો સારાંશ', 'New Document', 'नया दस्तावेज')}</span>
              </button>
            </div>
          </div>

          {/* Sub-Tab Navigation Bar */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 border-b border-slate-800">
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                activeTab === 'summary'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>{tr('મુખ્ય સારાંશ (Overview)', 'Key Overview', 'मुख्य सारांश')}</span>
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                activeTab === 'notes'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>{tr('રિવિઝન નોટ્સ (Notes)', 'Revision Notes', 'रिवीजन नोट्स')}</span>
            </button>

            <button
              onClick={() => setActiveTab('terms')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                activeTab === 'terms'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Lightbulb className="w-4 h-4" />
              <span>{tr('વ્યાખ્યાઓ (Key Terms)', 'Definitions & Terms', 'शब्दावली')}</span>
            </button>

            <button
              onClick={() => setActiveTab('qna')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                activeTab === 'qna'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>{tr('પરીક્ષા પ્રશ્નોત્તરી (Exam Q&A)', 'Exam Q&A Cards', 'परीक्षा प्रश्नोत्तरी')}</span>
            </button>

            {summaryData.importantFormulasOrRules?.length > 0 && (
              <button
                onClick={() => setActiveTab('formulas')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                  activeTab === 'formulas'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>{tr('સૂત્રો / નિયમો (Formulas)', 'Formulas & Rules', 'सूत्र एवं नियम')}</span>
              </button>
            )}
          </div>

          {/* Sub-Tab 1: Overview & Key Takeaways */}
          {activeTab === 'summary' && (
            <div className="space-y-5">
              {/* Executive Overview Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-base font-bold text-white">
                      {tr('વિષય વિહંગાવલોકન (Executive Overview)', 'Executive Overview', 'विषय अवलोकन')}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleCopy(summaryData.overview, 'overview')}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700"
                  >
                    {copiedKey === 'overview' ? (
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
                </div>

                <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal">
                  {summaryData.overview}
                </p>
              </div>

              {/* Key Takeaways Grid */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
                <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">
                    {tr('મુખ્ય સિદ્ધાંતો અને યાદ રાખવાના મુદ્દા (Key Takeaways)', 'Key Takeaways & Core Principles', 'मुख्य बिंदु और सिद्धांत')}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {summaryData.keyTakeaways.map((pt, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-start space-x-3 hover:border-emerald-500/40 transition-colors"
                    >
                      <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-500/20">
                        {idx + 1}
                      </span>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                        {pt}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sub-Tab 2: Structured Revision Notes */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              {summaryData.structuredNotes?.length > 0 ? (
                summaryData.structuredNotes.map((sec, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3 hover:border-purple-500/30 transition-all"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center space-x-2">
                        <span className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-400 font-bold text-xs flex items-center justify-center border border-purple-500/20">
                          {idx + 1}
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-white">
                          {sec.heading}
                        </h4>
                      </div>

                      <button
                        onClick={() => handleCopy(sec.points.join('\n• '), `sec-${idx}`)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                        title={tr('આ મુદ્દો કોપી કરો', 'Copy Section', 'कॉपी करें')}
                      >
                        {copiedKey === `sec-${idx}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <ul className="space-y-2 pt-1">
                      {sec.points.map((pt, pIdx) => (
                        <li key={pIdx} className="flex items-start space-x-2.5 text-xs sm:text-sm text-slate-300">
                          <span className="text-purple-400 font-bold mt-1">•</span>
                          <span className="leading-relaxed">{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-slate-900 rounded-3xl text-slate-400 text-xs">
                  {tr('કોઈ વિશિષ્ટ વિભાગો ઉપલબ્ધ નથી.', 'No structured sections available.', 'कोई अनुभाग उपलब्ध नहीं है।')}
                </div>
              )}
            </div>
          )}

          {/* Sub-Tab 3: Key Terms & Definitions */}
          {activeTab === 'terms' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {summaryData.keyTerms?.length > 0 ? (
                summaryData.keyTerms.map((kt, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2 hover:border-teal-500/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2 text-teal-400 mb-1">
                        <Lightbulb className="w-4 h-4" />
                        <h4 className="text-sm font-bold text-white">{kt.term}</h4>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed pt-1">
                        {kt.definition}
                      </p>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => handlePlayAudio(`${kt.term}: ${kt.definition}`, `kt-${idx}`)}
                        className="inline-flex items-center space-x-1 text-[11px] text-teal-400 hover:text-teal-300 font-semibold"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{tr('સાંભળો', 'Listen', 'सुनें')}</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 p-8 text-center bg-slate-900 rounded-3xl text-slate-400 text-xs">
                  {tr('આ લખાણમાંથી કોઈ ચોક્કસ વ્યાખ્યાઓ અલગ તારવી શકાઈ નથી.', 'No key definitions detected in this document.', 'कोई परिभाषाएं उपलब्ध नहीं हैं।')}
                </div>
              )}
            </div>
          )}

          {/* Sub-Tab 4: Exam Q&A Flashcards */}
          {activeTab === 'qna' && (
            <div className="space-y-4">
              {summaryData.examQuestions?.length > 0 ? (
                summaryData.examQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3 hover:border-amber-500/40 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {q.importance ? `${q.importance} Priority` : 'Exam Question'}
                      </span>

                      <button
                        onClick={() => handlePlayAudio(`પ્રશ્ન: ${q.question}. ઉત્તર: ${q.answer}`, `qna-${idx}`)}
                        className="inline-flex items-center space-x-1 text-xs text-amber-400 hover:text-amber-300 font-semibold"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{tr('સાંભળો', 'Listen', 'सुनें')}</span>
                      </button>
                    </div>

                    <div>
                      <p className="text-xs sm:text-sm font-bold text-white flex items-start space-x-2">
                        <span className="text-amber-400">Q{idx + 1}:</span>
                        <span>{q.question}</span>
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs sm:text-sm text-slate-300 leading-relaxed">
                      <span className="font-bold text-emerald-400 mr-1.5">{tr('ઉત્તર:', 'Answer:', 'उत्तर:')}</span>
                      {q.answer}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-slate-900 rounded-3xl text-slate-400 text-xs">
                  {tr('કોઈ પરીક્ષા પ્રશ્નો મળ્યા નથી.', 'No exam questions generated.', 'कोई प्रश्नोत्तरी उपलब्ध नहीं है।')}
                </div>
              )}
            </div>
          )}

          {/* Sub-Tab 5: Formulas & Rules */}
          {activeTab === 'formulas' && (
            <div className="space-y-3">
              {summaryData.importantFormulasOrRules?.map((rule, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex items-center space-x-3 hover:border-blue-500/40 transition-colors"
                >
                  <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 font-mono font-bold text-xs shrink-0">
                    #{idx + 1}
                  </span>
                  <p className="text-xs sm:text-sm font-medium text-slate-200">
                    {rule}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
