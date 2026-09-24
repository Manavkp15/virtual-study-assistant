import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  BookOpen,
  Search,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Volume2,
  ChevronDown,
  ChevronUp,
  Filter,
  CheckCircle2,
  Layers,
  GraduationCap,
  ExternalLink,
  Info
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { tr } from '../utils/tr';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

interface Citation {
  id: string;
  documentId: string;
  textbookTitle: string;
  board: string;
  standard: string;
  subject: string;
  medium: string;
  chapterName: string;
  chapterNumber?: number | null;
  pageNumber: number;
  excerpt: string;
  score: number;
}

interface RAGResponse {
  question: string;
  answer: string;
  isGrounded: boolean;
  relevanceScore: number;
  board?: string;
  citations: Citation[];
  groundingStatus: 'VERIFIED' | 'NOT_FOUND' | 'INSUFFICIENT_EVIDENCE';
}

export const TextbookRAGSection: React.FC = () => {
  const { t, i18n } = useTranslation(['ai', 'common']);
  const tts = useTextToSpeech();

  const [questionInput, setQuestionInput] = useState('');
  const [boardFilter, setBoardFilter] = useState<'ALL' | 'NCERT' | 'GSEB'>('ALL');
  const [standardFilter, setStandardFilter] = useState<string>('ALL');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const [ragResult, setRagResult] = useState<RAGResponse | null>(null);
  const [showCitations, setShowCitations] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const samplePrompts = [
    {
      labelEn: 'What is Force & Pressure according to NCERT?',
      labelGu: 'NCERT મુજબ બળ અને દબાણ એટલે શું?',
      q: i18n.language.startsWith('gu')
        ? 'બળ અને દબાણ એટલે શું અને તેનું સૂત્ર શું છે?'
        : 'What is force and pressure and what is its formula?'
    },
    {
      labelEn: 'Explain Photosynthesis from Class 7 Science',
      labelGu: 'ધોરણ ૭ વિજ્ઞાન: પ્રકાશસંશ્લેષણ પ્રક્રિયા સમજાવો',
      q: i18n.language.startsWith('gu')
        ? 'પ્રકાશસંશ્લેષણની પ્રક્રિયા અને તેનું સમીકરણ સમજાવો'
        : 'Explain the process and equation of photosynthesis in plants'
    },
    {
      labelEn: 'How to solve a linear equation in one variable?',
      labelGu: 'એકચલ સુરેખ સમીકરણનો ઉકેલ કેવી રીતે મેળવવો?',
      q: i18n.language.startsWith('gu')
        ? 'એકચલ સુરેખ સમીકરણ એટલે શું અને તેનો ઉકેલ કેવી રીતે શોધવો?'
        : 'What is a linear equation in one variable and how do you solve it?'
    },
    {
      labelEn: 'Atmospheric pressure & liquid pressure concepts',
      labelGu: 'વાતાવરણીય દબાણ અને પ્રવાહીનું દબાણ',
      q: i18n.language.startsWith('gu')
        ? 'વાતાવરણીય દબાણ અને પ્રવાહીમાં ઊંડાઈ સાથે દબાણ કેવી રીતે બદલાય છે?'
        : 'Explain atmospheric pressure and how liquid pressure changes with depth'
    }
  ];

  useEffect(() => {
    // Fetch knowledge base stats
    api.get('/rag/stats')
      .then(res => setStats(res.data?.stats))
      .catch(() => {});

    return () => {
      tts.stop();
    };
  }, []);

  const handleSearch = async (queryText?: string) => {
    const q = (queryText || questionInput).trim();
    if (!q || loading) return;

    if (!queryText) setQuestionInput('');
    setLoading(true);
    tts.stop();

    try {
      const res = await api.post('/rag/ask', {
        question: q,
        board: boardFilter,
        standard: standardFilter,
        subject: subjectFilter,
        language: i18n.language
      });

      setRagResult(res.data);
      setShowCitations(true);
    } catch (err: any) {
      console.error('RAG query failed:', err);
      setRagResult({
        question: q,
        answer: tr(
          'આ માહિતી ઉપલબ્ધ NCERT/ગુજરાત બોર્ડના પાઠ્યપુસ્તકોમાં મળી શકી નથી.',
          'This information could not be found in the available NCERT/Gujarat Board textbooks.'
        ),
        isGrounded: false,
        relevanceScore: 0,
        citations: [],
        groundingStatus: 'NOT_FOUND'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Knowledge Base Overview Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/30">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>{tr('NCERT અને ગુજરાત બોર્ડ અધિકૃત પાઠ્યપુસ્તક પ્રણાલી', 'Authorized NCERT & GSEB Textbook Knowledge Base')}</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {tr('પાઠ્યપુસ્તક આધારિત AI પ્રશ્નોત્તરી (RAG સિસ્ટમ)', 'RAG-Based Textbook Knowledge Assistant')}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {tr(
                'તમારા પ્રશ્નોના જવાબો સીધા NCERT અને ગુજરાત રાજ્ય શાળા પાઠ્યપુસ્તક મંડળના પુસ્તકોમાંથી પ્રાપ્ત કરો. કોઈપણ બહારની અપ્રમાણિત માહિતી વિના, પુસ્તકના પાના નંબર અને સંદર્ભ સાથે અધિકૃત ઉત્તર.',
                'Ask any curriculum question and receive answers strictly verified and retrieved from official NCERT & Gujarat Board textbooks, complete with page numbers and citations.'
              )}
            </p>
          </div>

          {/* Quick Stats Pill */}
          {stats && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-2xl text-center">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">NCERT</span>
                <span className="text-sm font-bold text-blue-400">{stats.ncertCount} {tr('પુસ્તકો', 'Books')}</span>
              </div>
              <div className="px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-2xl text-center">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">GSEB</span>
                <span className="text-sm font-bold text-emerald-400">{stats.gsebCount} {tr('પુસ્તકો', 'Books')}</span>
              </div>
              <div className="px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-2xl text-center">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">{tr('ઇન્ડેક્સ', 'Chunks')}</span>
                <span className="text-sm font-bold text-purple-400">{stats.totalChunks}</span>
              </div>
            </div>
          )}
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Board Selector */}
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="text-slate-400 font-semibold flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5" />
              <span>{tr('બોર્ડ પસંદ કરો:', 'Board:')}</span>
            </span>

            <div className="inline-flex p-0.5 bg-slate-800 rounded-xl border border-slate-700">
              {(['ALL', 'NCERT', 'GSEB'] as const).map(b => (
                <button
                  key={b}
                  onClick={() => setBoardFilter(b)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all text-[11px] ${
                    boardFilter === b
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {b === 'ALL' ? tr('બધા બોર્ડ', 'All Boards') : b}
                </button>
              ))}
            </div>
          </div>

          {/* Standard & Subject Selectors */}
          <div className="flex items-center space-x-2 flex-wrap">
            <select
              value={standardFilter}
              onChange={e => setStandardFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">{tr('બધા ધોરણ (All Classes)', 'All Classes (6-8)')}</option>
              <option value="Standard 6">Standard 6 (ધોરણ ૬)</option>
              <option value="Standard 7">Standard 7 (ધોરણ ૭)</option>
              <option value="Standard 8">Standard 8 (ધોરણ ૮)</option>
            </select>

            <select
              value={subjectFilter}
              onChange={e => setSubjectFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">{tr('બધા વિષયો', 'All Subjects')}</option>
              <option value="Science">{tr('વિજ્ઞાન (Science)', 'Science')}</option>
              <option value="Mathematics">{tr('ગણિત (Mathematics)', 'Mathematics')}</option>
              <option value="Social Science">{tr('સામાજિક વિજ્ઞાન', 'Social Science')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Query Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="relative">
          <input
            type="text"
            value={questionInput}
            onChange={e => setQuestionInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder={tr(
              'પાઠ્યપુસ્તક સંબંધિત પ્રશ્ન પૂછો (દા.ત. બળ અને દબાણનો તફાવત, પ્રકાશસંશ્લેષણ)...',
              'Ask any NCERT / Gujarat Board question (e.g. What is force, photosynthesis equation)...'
            )}
            className="w-full pl-4 pr-12 py-3.5 bg-slate-800/90 border border-slate-700/80 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs sm:text-sm"
          />
          <button
            onClick={() => handleSearch()}
            disabled={loading || !questionInput.trim()}
            className="absolute right-2 top-2 p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl transition-all shadow-md shadow-blue-600/30"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Curriculum Prompts */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center space-x-1.5 text-slate-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>{tr('અભ્યાસક્રમમાંથી લોકપ્રિય પ્રશ્નો:', 'NCERT / GSEB Quick Topics:')}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSearch(p.q)}
                disabled={loading}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium rounded-xl border border-slate-700 transition-all text-left"
              >
                {i18n.language.startsWith('gu') ? p.labelGu : p.labelEn}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-300">
            {tr('પાઠ્યપુસ્તકના પાનાઓમાં સંશોધન થઈ રહ્યું છે...', 'Searching and verifying across NCERT & Gujarat Board textbooks...')}
          </p>
          <p className="text-[11px] text-slate-500">
            {tr('અધિકૃત સંદર્ભો અને સૂત્રો ચકાસવામાં આવી રહ્યા છે', 'Retrieving semantic passages and checking factual grounding')}
          </p>
        </div>
      )}

      {/* RAG Answer Display */}
      {ragResult && !loading && (
        <div className="space-y-4">
          {/* Main Answer Card */}
          <div
            className={`border rounded-3xl p-6 shadow-2xl space-y-4 transition-all ${
              ragResult.isGrounded
                ? 'bg-slate-900 border-emerald-500/40 shadow-emerald-500/5'
                : 'bg-slate-900 border-amber-500/40 shadow-amber-500/5'
            }`}
          >
            {/* Grounding Verification Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                {ragResult.isGrounded ? (
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>
                      {tr(
                        'અધિકૃત પાઠ્યપુસ્તક દ્વારા ચકાસાયેલ',
                        'Verified NCERT / Gujarat Board Textbook Answer'
                      )}
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>
                      {tr(
                        'પાઠ્યપુસ્તકમાં માહિતી ઉપલબ્ધ નથી',
                        'Information Not Found in Available Textbooks'
                      )}
                    </span>
                  </div>
                )}

                {ragResult.isGrounded && (
                  <span className="text-[11px] font-semibold text-slate-400">
                    {tr('મેળ સ્કોર:', 'Relevance Match:')} <strong className="text-emerald-400">{ragResult.relevanceScore}%</strong>
                  </span>
                )}
              </div>

              {/* TTS Read Aloud Button */}
              <button
                onClick={() => tts.speak('rag-answer', ragResult.answer, i18n.language)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-bold transition-all self-start sm:self-auto"
                title={tr('આખો જવાબ સાંભળો', 'Listen to textbook answer')}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{tr('જવાબ સાંભળો (TTS)', 'Read Aloud')}</span>
              </button>
            </div>

            {/* Answer Content */}
            <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
              <p>{ragResult.answer}</p>
            </div>

            {/* Citations Tray Header */}
            {ragResult.citations.length > 0 && (
              <div className="pt-2">
                <button
                  onClick={() => setShowCitations(prev => !prev)}
                  className="flex items-center space-x-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>
                    {tr('અધિકૃત સંદર્ભો અને અવતરણો', 'Verified Textbook Sources & Citations')} ({ragResult.citations.length})
                  </span>
                  {showCitations ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>

          {/* Citations Cards List */}
          {showCitations && ragResult.citations.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5 px-1">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>{tr('સંદર્ભ પાઠ્યપુસ્તક ફકરાઓ:', 'Supporting Textbook Passages:')}</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ragResult.citations.map((c, idx) => (
                  <div
                    key={c.id || idx}
                    className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2 hover:border-slate-700 transition-all"
                  >
                    {/* Header info */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20">
                        <span>{c.board}</span>
                        <span>•</span>
                        <span>{c.standard}</span>
                      </span>

                      <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-lg">
                        {tr('પાનું', 'Page')} {c.pageNumber}
                      </span>
                    </div>

                    <h5 className="font-bold text-white text-xs truncate">
                      {c.textbookTitle}
                    </h5>

                    {/* Excerpt */}
                    <p className="text-[11px] text-slate-300 leading-normal italic bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
                      "{c.excerpt}"
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                      <span>{c.subject} ({c.medium} Medium)</span>
                      <button
                        onClick={() => tts.speak(`citation-${idx}`, c.excerpt, i18n.language)}
                        className="text-blue-400 hover:underline flex items-center space-x-1 font-semibold"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>{tr('સાંભળો', 'Listen')}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
