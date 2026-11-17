import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import {
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Search,
  FileText,
  Sparkles,
  Filter,
  Volume2,
  Layers,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Clock,
  ArrowRight,
  RefreshCw,
  X,
  BookCheck,
  Sliders,
  HelpCircle,
  Check
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
  topicName?: string | null;
  sectionName?: string | null;
  pageNumber: number;
  excerpt: string;
  score: number;
}

interface StepItem {
  stepNumber: number;
  title: string;
  description: string;
  ncertConceptLink?: string;
}

interface RAGResponse {
  question: string;
  answer: string;
  isGrounded: boolean;
  relevanceScore: number;
  board?: string;
  citations: Citation[];
  groundingStatus: 'VERIFIED' | 'NOT_FOUND' | 'INSUFFICIENT_EVIDENCE';
  sourceVerification: string;
  stepByStepSolution?: StepItem[];
  sourceChunkIds?: string[];
  auditId?: string;
}

export const NcertKnowledgeBasePage: React.FC = () => {
  const { t, i18n } = useTranslation(['ai', 'common']);
  const tts = useTextToSpeech();

  // Navigation tab - strictly student-oriented
  const [activeTab, setActiveTab] = useState<'ASK' | 'BROWSE'>('ASK');

  // Search / Ask state
  const [questionInput, setQuestionInput] = useState('');
  const [ncertMode, setNcertMode] = useState(true);
  const [selectedStandard, setSelectedStandard] = useState<string>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const [ragResult, setRagResult] = useState<RAGResponse | null>(null);
  const [activeModalCitation, setActiveModalCitation] = useState<Citation | null>(null);

  // Browse state
  const [browseDocs, setBrowseDocs] = useState<any[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseSearch, setBrowseSearch] = useState('');
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState<any>(null);

  // Quick prompt suggestions
  const samplePrompts = [
    {
      label: 'Linear Equations: Exercise 3.2 (Page 58)',
      q: 'How to solve a pair of linear equations by substitution method according to NCERT Class 10 Mathematics Exercise 3.2?',
      std: 'Class 10',
      sub: 'Mathematics'
    },
    {
      label: "Newton's Second Law & F=ma Derivation",
      q: "Explain Newton's Second Law of Motion and derive the formula F = ma with SI units according to NCERT Class 9 Science Chapter 9.",
      std: 'Class 9',
      sub: 'Science'
    },
    {
      label: 'Types of Chemical Reactions (Section 1.2)',
      q: 'Explain the 5 types of chemical reactions with balanced equation examples from NCERT Class 10 Science Chapter 1.',
      std: 'Class 10',
      sub: 'Science'
    },
    {
      label: 'Pressure Formula & School Bag Straps',
      q: 'What is the formula of pressure (P = F / A) and why do school bags have wide shoulder straps according to NCERT Class 8 Science Chapter 11?',
      std: 'Standard 8',
      sub: 'Science'
    },
    {
      label: 'Photosynthesis Chemical Equation',
      q: 'Explain the process and chemical equation of photosynthesis according to NCERT Class 7 Science Chapter 1.',
      std: 'Standard 7',
      sub: 'Science'
    },
    {
      label: 'East India Company Charter (1600)',
      q: 'What charter did the East India Company acquire from Queen Elizabeth I in 1600 according to NCERT Class 8 Social Science History Chapter 2?',
      std: 'Standard 8',
      sub: 'Social Science'
    }
  ];

  // Load initial stats
  useEffect(() => {
    fetchStats();
    return () => {
      tts.stop();
    };
  }, []);

  // When tab changes or filters change, load corresponding browse data
  useEffect(() => {
    if (activeTab === 'BROWSE') {
      fetchBrowseContent();
    }
  }, [activeTab, selectedStandard, selectedSubject]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/rag/stats');
      if (res.data?.stats) setStats(res.data.stats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const fetchBrowseContent = async () => {
    setBrowseLoading(true);
    try {
      const params: any = { board: 'NCERT' };
      if (selectedStandard !== 'ALL') params.standard = selectedStandard;
      if (selectedSubject !== 'ALL') params.subject = selectedSubject;
      const res = await api.get('/rag/browse', { params });
      setBrowseDocs(res.data?.documents || []);
    } catch (err) {
      console.error('Failed to fetch browse content:', err);
    } finally {
      setBrowseLoading(false);
    }
  };

  const handleAsk = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const query = (customQuery !== undefined ? customQuery : questionInput).trim();
    if (!query) return;

    setLoading(true);
    setRagResult(null);
    tts.stop();

    try {
      const res = await api.post('/rag/ask', {
        question: query,
        board: ncertMode ? 'NCERT' : 'ALL',
        standard: selectedStandard !== 'ALL' ? selectedStandard : undefined,
        subject: selectedSubject !== 'ALL' ? selectedSubject : undefined,
        language: i18n.language,
        ncertMode
      });

      setRagResult(res.data);
      fetchStats();
    } catch (err: any) {
      console.error('Error asking NCERT database:', err);
      setRagResult({
        question: query,
        answer: tr(
          'આ માહિતી ઉપલબ્ધ NCERT પાઠ્યપુસ્તકોમાંથી ચકાસી શકાઈ નથી.',
          'This information could not be verified from the available NCERT sources.'
        ),
        isGrounded: false,
        relevanceScore: 0,
        citations: [],
        groundingStatus: 'NOT_FOUND',
        sourceVerification: ''
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredBrowseDocs = browseDocs.filter(d => {
    if (!browseSearch.trim()) return true;
    const q = browseSearch.toLowerCase();
    return (
      d.title?.toLowerCase().includes(q) ||
      d.chapterName?.toLowerCase().includes(q) ||
      d.topic?.toLowerCase().includes(q) ||
      d.chunks?.some((c: any) => c.content?.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Top Banner / Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-indigo-950/70 border border-emerald-500/20 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold tracking-wide uppercase shadow-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{tr('100% NCERT પ્રમાણિત', '100% NCERT-Verified')}</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-semibold">
                <span>RAG Retrieval-Augmented Generation</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-semibold">
                <span>{tr('શૂન્ય કાલ્પનિક ઉત્તર', 'Zero Hallucinations')}</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {tr('NCERT પ્રમાણિત જ્ઞાનકોશ', 'NCERT-Verified Knowledge Database')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              {tr(
                'અધિકૃત NCERT પાઠ્યપુસ્તકોમાંથી સીધા સંદર્ભિત ઉત્તરો, પ્રકરણ-મુદ્દા વાર ચકાસણી અને ગણિત-વિજ્ઞાનના પગલાંવાર ઉકેલો.',
                'Curriculum-aligned educational assistant strictly grounded in authorized NCERT textbooks with verifiable citations and step-by-step solutions.'
              )}
            </p>
          </div>

          {/* Quick Stats Pill */}
          {stats && (
            <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-700/80 rounded-2xl p-3.5 backdrop-blur-md shrink-0 shadow-lg">
              <div className="text-center px-3 border-r border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400">{tr('પુસ્તકો', 'NCERT Books')}</p>
                <p className="text-xl font-black text-emerald-400">{stats.ncertCount || 0}</p>
              </div>
              <div className="text-center px-3 border-r border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400">{tr('નોલેજ ચંક્સ', 'Chunks')}</p>
                <p className="text-xl font-black text-blue-400">{stats.totalChunks || 0}</p>
              </div>
              <div className="text-center px-3">
                <p className="text-[10px] uppercase font-bold text-slate-400">{tr('ચકાસાયેલ પ્રશ્નો', 'Audits')}</p>
                <p className="text-xl font-black text-purple-400">{stats.totalAudits || 0}</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('ASK')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
              activeTab === 'ASK'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{tr('NCERT શંકા નિવારણ', 'Ask NCERT Assistant')}</span>
          </button>

          <button
            onClick={() => setActiveTab('BROWSE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
              activeTab === 'BROWSE'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{tr('NCERT પુસ્તકાલય બ્રાઉઝ કરો', 'Explore NCERT Library')}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ASK NCERT ASSISTANT */}
      {activeTab === 'ASK' && (
        <div className="space-y-6">
          {/* Controls Bar: Filters & NCERT Mode Toggle */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            {/* Class & Subject Filter */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-300">{tr('વર્ગ / ધોરણ:', 'Class:')}</span>
                <select
                  value={selectedStandard}
                  onChange={(e) => setSelectedStandard(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">{tr('બધા વર્ગ (All Classes)', 'All Classes (6-10)')}</option>
                  <option value="Class 10">Class 10 (ધોરણ ૧૦)</option>
                  <option value="Class 9">Class 9 (ધોરણ ૯)</option>
                  <option value="Standard 8">Class 8 (ધોરણ ૮)</option>
                  <option value="Standard 7">Class 7 (ધોરણ ૭)</option>
                  <option value="Standard 6">Class 6 (ધોરણ ૬)</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-300">{tr('વિષય:', 'Subject:')}</span>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">{tr('બધા વિષયો', 'All Subjects')}</option>
                  <option value="Mathematics">Mathematics (ગણિત)</option>
                  <option value="Science">Science (વિજ્ઞાન)</option>
                  <option value="Social Science">Social Science (સામાજિક વિજ્ઞાન)</option>
                  <option value="English">English (અંગ્રેજી)</option>
                  <option value="Hindi">Hindi (હિન્દી)</option>
                </select>
              </div>
            </div>

            {/* NCERT Mode Toggle Button */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setNcertMode(!ncertMode)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
                  ncertMode
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                <ShieldCheck className={`w-4 h-4 ${ncertMode ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>
                  {ncertMode
                    ? tr('NCERT મોડ: સક્રિય (કડક ચકાસણી)', 'NCERT Mode: ACTIVE (Strict Grounding)')
                    : tr('NCERT મોડ: બંધ', 'NCERT Mode: OFF')}
                </span>
              </button>
            </div>
          </div>

          {/* Preset / Sample Questions */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{tr('નમૂનારૂપ NCERT પ્રશ્નો:', 'NCERT Curriculum Examples:')}</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuestionInput(p.q);
                    setSelectedStandard(p.std);
                    setSelectedSubject(p.sub);
                    handleAsk(undefined, p.q);
                  }}
                  className="text-left p-3 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/40 transition-all text-xs group flex items-start justify-between gap-2 shadow-sm"
                >
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 block mb-0.5">
                      {p.std} • {p.sub}
                    </span>
                    <p className="text-slate-200 group-hover:text-white font-medium line-clamp-2">
                      {p.label}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 shrink-0 mt-1 transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </div>

          {/* Query Form */}
          <form onSubmit={handleAsk} className="relative">
            <div className="bg-slate-900 border border-slate-800 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-2xl p-2 flex items-center gap-2 shadow-xl transition-all">
              <div className="p-2 text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                placeholder={tr(
                  'NCERT સંબંધિત પ્રશ્ન લખો (દા.ત. Linear Equations Exercise 3.2, Newton Second Law, Photosynthesis)...',
                  'Ask any NCERT question (e.g. Linear Equations Exercise 3.2, Newton Second Law, Types of Chemical Reactions)...'
                )}
                className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none py-2"
              />
              {questionInput && (
                <button
                  type="button"
                  onClick={() => setQuestionInput('')}
                  className="text-slate-500 hover:text-slate-300 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                disabled={loading || !questionInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-600/30 transition-all shrink-0"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{tr('શોધી રહ્યું છે...', 'Searching NCERT...')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{tr('શોધો & ઉત્તર મેળવો', 'Search & Verify')}</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* RAG Answer Display */}
          {ragResult && (
            <div
              className={`rounded-3xl border p-6 sm:p-7 shadow-2xl transition-all space-y-5 ${
                ragResult.isGrounded
                  ? 'bg-slate-900/95 border-emerald-500/40 ring-1 ring-emerald-500/20'
                  : 'bg-slate-900/95 border-rose-500/30'
              }`}
            >
              {/* Header Badge & Confidence */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-2.5">
                  {ragResult.isGrounded ? (
                    <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold tracking-wide uppercase">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>{tr('NCERT પ્રમાણિત ઉત્તર', 'NCERT Verified Answer')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-extrabold tracking-wide uppercase">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>{tr('NCERT માં ઉપલબ્ધ નથી', 'Not Found in NCERT')}</span>
                    </div>
                  )}

                  {ragResult.isGrounded && (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                      {tr('વિશ્વાસ સ્કોર:', 'Confidence:')} <strong className="text-emerald-400">{ragResult.relevanceScore}%</strong>
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {ragResult.isGrounded && (
                    <button
                      type="button"
                      onClick={() => tts.speak('rag-answer', ragResult.answer, i18n.language)}
                      className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-slate-700"
                      title={tr('ઉત્તર સાંભળો', 'Listen to answer')}
                    >
                      <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>{tr('સાંભળો', 'Listen')}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Verified Answer Body */}
              <div className="text-slate-100 text-sm leading-relaxed whitespace-pre-line font-normal space-y-3">
                {ragResult.answer}
              </div>

              {/* Step-by-Step Solutions for Mathematics & Science */}
              {ragResult.stepByStepSolution && ragResult.stepByStepSolution.length > 0 && (
                <div className="mt-5 p-5 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4" />
                    <span>{tr('પગલાંવાર NCERT ઉકેલ (Step-by-Step Solution)', 'NCERT Step-by-Step Solution')}</span>
                  </h4>
                  <div className="space-y-3 pt-1">
                    {ragResult.stepByStepSolution.map((st) => (
                      <div key={st.stepNumber} className="flex items-start space-x-3 text-xs">
                        <span className="w-6 h-6 rounded-full bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-bold shrink-0 mt-0.5">
                          {st.stepNumber}
                        </span>
                        <div className="space-y-1">
                          <p className="font-bold text-white">{st.title}</p>
                          <p className="text-slate-300">{st.description}</p>
                          {st.ncertConceptLink && (
                            <span className="inline-block text-[10px] text-emerald-400 font-mono bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                              🔗 {st.ncertConceptLink}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Source Verification Box */}
              {ragResult.isGrounded && ragResult.sourceVerification && (
                <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
                      {tr('સંદર્ભ ચકાસણી (Proof / Source Verification)', 'Proof / Source Verification')}
                    </span>
                    <p className="text-xs font-bold text-white flex items-center space-x-1.5">
                      <span>📌</span>
                      <span>{ragResult.sourceVerification}</span>
                    </p>
                  </div>

                  {ragResult.citations.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveModalCitation(ragResult.citations[0])}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 shrink-0 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{tr('સંદર્ભ જુઓ', 'View Source')}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Supporting Passages & Multi-Citation list */}
              {ragResult.citations.length > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                    <BookCheck className="w-3.5 h-3.5 text-blue-400" />
                    <span>
                      {tr('ચકાસાયેલ NCERT સંદર્ભો', 'Verified NCERT Passages')} ({ragResult.citations.length})
                    </span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {ragResult.citations.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => setActiveModalCitation(c)}
                        className="p-3 bg-slate-950/60 border border-slate-800 hover:border-emerald-500/40 rounded-xl cursor-pointer transition-all space-y-1 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-emerald-400">
                            {c.standard} • {c.subject}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {tr('પાનું', 'Page')} {c.pageNumber}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-white group-hover:text-emerald-300 line-clamp-1">
                          {c.chapterName}
                        </p>
                        {c.sectionName && (
                          <span className="inline-block text-[10px] text-purple-300 bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-500/20">
                            {c.sectionName}
                          </span>
                        )}
                        <p className="text-[11px] text-slate-400 line-clamp-2 pt-0.5">
                          {c.excerpt}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audit Traceability Footer */}
              {ragResult.auditId && (
                <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Audit Traceability ID: {ragResult.auditId}</span>
                  {ragResult.sourceChunkIds && (
                    <span>Chunk Sources: {ragResult.sourceChunkIds.length}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EXPLORE NCERT LIBRARY (BROWSE BY CLASS & SUBJECT) */}
      {activeTab === 'BROWSE' && (
        <div className="space-y-6">
          {/* Filters & Search */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-slate-300">{tr('વર્ગ / ધોરણ:', 'Class:')}</span>
                <select
                  value={selectedStandard}
                  onChange={(e) => setSelectedStandard(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">{tr('બધા વર્ગ', 'All Classes')}</option>
                  <option value="Class 10">Class 10</option>
                  <option value="Class 9">Class 9</option>
                  <option value="Standard 8">Class 8</option>
                  <option value="Standard 7">Class 7</option>
                  <option value="Standard 6">Class 6</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-300">{tr('વિષય:', 'Subject:')}</span>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">{tr('બધા વિષયો', 'All Subjects')}</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="Social Science">Social Science</option>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                </select>
              </div>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={browseSearch}
                onChange={(e) => setBrowseSearch(e.target.value)}
                placeholder={tr('પ્રકરણ અથવા મુદ્દો શોધો...', 'Search chapters or topics...')}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Chapters & Documents List */}
          {browseLoading ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-400" />
              <p className="text-xs">{tr('NCERT પુસ્તકાલય લોડ થઈ રહ્યું છે...', 'Loading NCERT library...')}</p>
            </div>
          ) : filteredBrowseDocs.length === 0 ? (
            <div className="p-12 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-2">
              <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm font-bold text-slate-300">{tr('કોઈ પુસ્તકો મળ્યા નથી', 'No NCERT documents match your filter')}</p>
              <p className="text-xs text-slate-500">{tr('કૃપા કરીને વર્ગ અથવા વિષય ફિલ્ટર બદલો.', 'Try selecting All Classes or another subject.')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredBrowseDocs.map((doc) => {
                const isExpanded = expandedDocId === doc.id;
                return (
                  <div
                    key={doc.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase border border-emerald-500/30">
                            {doc.board}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-[10px] font-bold">
                            {doc.standard}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                            {doc.subject}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-mono">
                            v{doc.version || '1.0'}
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-white">
                          {doc.chapterNumber ? `Chapter ${doc.chapterNumber}: ` : ''}{doc.chapterName || doc.title}
                        </h3>
                        {doc.topic && (
                          <p className="text-xs text-emerald-400 font-medium">
                            📌 {doc.topic}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('ASK');
                            setQuestionInput(`Explain ${doc.chapterName || doc.title} from NCERT ${doc.standard} ${doc.subject}`);
                            setSelectedStandard(doc.standard);
                            setSelectedSubject(doc.subject);
                            handleAsk(undefined, `Explain ${doc.chapterName || doc.title} from NCERT ${doc.standard} ${doc.subject}`);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center space-x-1.5 transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{tr('આ પ્રકરણ વિશે પૂછો', 'Ask About Chapter')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setExpandedDocId(isExpanded ? null : doc.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1 transition-all"
                        >
                          <span>{doc.chunks?.length || 0} {tr('મુદ્દાઓ', 'Passages')}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Chunks / Sections Drawer */}
                    {isExpanded && doc.chunks && (
                      <div className="pt-4 border-t border-slate-800 space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          {tr('પ્રમાણિત વિભાગો અને પ્રશ્નોત્તરી (Verified Sections & Passages)', 'Verified Textbook Sections & Passages')}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {doc.chunks.map((chk: any) => (
                            <div
                              key={chk.id}
                              className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-2 text-xs"
                            >
                              <div className="flex items-center justify-between text-[10px] font-bold">
                                <span className="text-emerald-400">{chk.sectionName || chk.topicName || 'Section'}</span>
                                <span className="text-slate-400">{tr('પાનું', 'Page')} {chk.pageNumber}</span>
                              </div>
                              <p className="text-slate-200 leading-relaxed">{chk.content}</p>
                              {chk.questionText && chk.answerText && (
                                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px] space-y-1">
                                  <p className="font-bold text-emerald-300">Q: {chk.questionText}</p>
                                  <p className="text-slate-300">A: {chk.answerText}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* "VIEW SOURCE" DETAIL MODAL */}
      {activeModalCitation && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-extrabold text-white">
                  {tr('સત્તાવાર NCERT સંદર્ભ વિગતો', 'Authorized NCERT Source Verification')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalCitation(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <p className="text-xs font-bold text-emerald-300">{activeModalCitation.textbookTitle}</p>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 pt-1">
                  <span>Class: <strong>{activeModalCitation.standard}</strong></span>
                  <span>•</span>
                  <span>Subject: <strong>{activeModalCitation.subject}</strong></span>
                  <span>•</span>
                  <span>Page: <strong className="text-emerald-400">{activeModalCitation.pageNumber}</strong></span>
                  {activeModalCitation.sectionName && (
                    <>
                      <span>•</span>
                      <span>Section: <strong className="text-purple-300">{activeModalCitation.sectionName}</strong></span>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {tr('પાઠ્યપુસ્તકમાંથી અક્ષરશઃ ફકરો (Verbatim Text):', 'Verbatim Textbook Passages:')}
                </span>
                <div className="p-4 bg-slate-950 border border-emerald-500/20 rounded-2xl text-xs text-slate-200 leading-relaxed font-sans max-h-60 overflow-y-auto">
                  {activeModalCitation.excerpt}
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[10px] text-slate-500 font-mono space-y-0.5">
                <p>Chunk ID: {activeModalCitation.id}</p>
                <p>Document ID: {activeModalCitation.documentId}</p>
                <p>Semantic Match Score: {activeModalCitation.score}%</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModalCitation(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
              >
                {tr('બંધ કરો', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NcertKnowledgeBasePage;
