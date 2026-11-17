import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { tr } from '../utils/tr';
import { TEACHER_SUBJECTS } from '../utils/subjectConstants';
import {
  BookA,
  Search,
  X,
  Volume2,
  VolumeX,
  Bookmark,
  BookmarkCheck,
  Copy,
  Check,
  Sparkles,
  GraduationCap,
  Lightbulb,
  FileText,
  Clock,
  Trash2,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Filter,
  Layers,
  ArrowRight
} from 'lucide-react';

interface DictionaryEntry {
  word: string;
  phonetic: string;
  pronunciation: string;
  partOfSpeech: string;
  meaning: string;
  simpleMeaning: string;
  detailedMeaning: string;
  explainSimply: string;
  explainForExam: string;
  exampleSentences: string[];
  synonyms: string[];
  antonyms: string[];
  relatedWords: string[];
  meaningGu: string;
  simpleMeaningGu: string;
  detailedMeaningGu: string;
  explainSimplyGu: string;
  explainForExamGu: string;
  exampleSentencesGu: string[];
  synonymsGu: string[];
  antonymsGu: string[];
  relatedWordsGu: string[];
  subject?: string;
  chapter?: string;
  topic?: string;
  isAcademic: boolean;
}

interface SavedWordItem {
  id: string;
  word: string;
  meaning: string;
  pronunciation?: string;
  partOfSpeech?: string;
  simpleMeaning?: string;
  detailedMeaning?: string;
  exampleSentences?: string[];
  synonyms?: string[];
  antonyms?: string[];
  relatedWords?: string[];
  explainSimply?: string;
  explainForExam?: string;
  meaningGu?: string;
  simpleMeaningGu?: string;
  subject?: string;
  chapter?: string;
  topic?: string;
  createdAt: string;
}

interface RecentSearchItem {
  id: string;
  word: string;
  searchedAt: string;
  subject?: string;
}

export const AiDictionaryPage: React.FC = () => {
  const { i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isGu = i18n.language === 'gu';

  // Active Tab: 'search' | 'vocabulary'
  const [activeTab, setActiveTab] = useState<'search' | 'vocabulary'>('search');

  // Search Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [chapterFilter, setChapterFilter] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [showContextFilters, setShowContextFilters] = useState(false);

  // Search Results State
  const [loading, setLoading] = useState(false);
  const [searchedWord, setSearchedWord] = useState<string | null>(null);
  const [entry, setEntry] = useState<DictionaryEntry | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [notFoundMessage, setNotFoundMessage] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [savedWordId, setSavedWordId] = useState<string | null>(null);
  const [savingAction, setSavingAction] = useState(false);

  // Explanation perspective tab: 'simple' | 'exam'
  const [explanationMode, setExplanationMode] = useState<'simple' | 'exam'>('simple');

  // Copy feedback
  const [copied, setCopied] = useState(false);

  // Audio Pronunciation State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Recent Searches
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);

  // Saved Words (My Vocabulary)
  const [savedWords, setSavedWords] = useState<SavedWordItem[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [vocabSearchFilter, setVocabSearchFilter] = useState('');
  const [vocabSubjectFilter, setVocabSubjectFilter] = useState('ALL');

  // Load initial params from URL if present
  useEffect(() => {
    const wordParam = searchParams.get('word');
    const subjectParam = searchParams.get('subject');
    const chapterParam = searchParams.get('chapter');
    const topicParam = searchParams.get('topic');

    if (subjectParam) {
      setSelectedSubject(subjectParam);
    }
    if (chapterParam) {
      setChapterFilter(chapterParam);
      setShowContextFilters(true);
    }
    if (topicParam) {
      setTopicFilter(topicParam);
      setShowContextFilters(true);
    }

    if (wordParam) {
      setSearchQuery(wordParam);
      handleSearch(wordParam, subjectParam || 'ALL', chapterParam || '', topicParam || '');
    } else {
      // Default initial term for immediate discovery
      handleSearch('Photosynthesis', 'Science');
    }

    fetchRecentSearches();
    fetchSavedWords();
  }, []);

  // Fetch recent searches
  const fetchRecentSearches = async () => {
    try {
      const res = await api.get('/ai-dictionary/recent');
      if (res.data?.recentSearches) {
        setRecentSearches(res.data.recentSearches);
      }
    } catch (err) {
      // Non-blocking for unauthenticated or first load
    }
  };

  // Fetch saved words
  const fetchSavedWords = async () => {
    setLoadingSaved(true);
    try {
      const res = await api.get('/ai-dictionary/saved');
      if (res.data?.savedWords) {
        setSavedWords(res.data.savedWords);
      }
    } catch (err) {
      // Non-blocking
    } finally {
      setLoadingSaved(false);
    }
  };

  // Handle Search Execution
  const handleSearch = async (
    wordToSearch?: string,
    overrideSubject?: string,
    overrideChapter?: string,
    overrideTopic?: string
  ) => {
    const term = (wordToSearch !== undefined ? wordToSearch : searchQuery).trim();
    if (!term) return;

    setLoading(true);
    setNotFound(false);
    setSearchedWord(term);
    setActiveTab('search');

    const subjectToSend = overrideSubject !== undefined ? overrideSubject : selectedSubject;
    const chapterToSend = overrideChapter !== undefined ? overrideChapter : chapterFilter;
    const topicToSend = overrideTopic !== undefined ? overrideTopic : topicFilter;

    // Update query params without reloading
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      p.set('word', term);
      if (subjectToSend && subjectToSend !== 'ALL') p.set('subject', subjectToSend);
      else p.delete('subject');
      return p;
    });

    try {
      const res = await api.post('/ai-dictionary/search', {
        word: term,
        language: i18n.language || 'en',
        subject: subjectToSend !== 'ALL' ? subjectToSend : undefined,
        chapter: chapterToSend || undefined,
        topic: topicToSend || undefined
      });

      if (res.data.found && res.data.entry) {
        setEntry(res.data.entry);
        setIsSaved(Boolean(res.data.isSaved));
        setSavedWordId(res.data.savedWordId || null);
        setNotFound(false);
      } else {
        setEntry(null);
        setNotFound(true);
        setNotFoundMessage(
          isGu
            ? (res.data.messageGu || 'શબ્દ મળ્યો નથી. જોડણી તપાસીને ફરી પ્રયાસ કરો.')
            : (res.data.message || 'Word not found. Try checking the spelling.')
        );
        setSuggestions(res.data.suggestions || ['Photosynthesis', 'Gravity', 'Respiration', 'Polynomial', 'Constitution']);
      }

      fetchRecentSearches();
    } catch (err: any) {
      setEntry(null);
      setNotFound(true);
      setNotFoundMessage(
        isGu
          ? 'શબ્દકોશ શોધવામાં ભૂલ આવી. કૃપા કરીને ફરી પ્રયાસ કરો.'
          : 'Error searching dictionary. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Audio Speech Pronunciation
  const handleSpeak = (textToSpeak: string) => {
    if (!('speechSynthesis' in window)) {
      alert(tr('તમારા બ્રાઉઝરમાં ઓડિયો સપોર્ટ ઉપલબ્ધ નથી.', 'Speech synthesis not supported in this browser.'));
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    speechUtteranceRef.current = utterance;

    // Check language of word
    const isGujaratiWord = /[\u0A80-\u0AFF]/.test(textToSpeak);
    utterance.lang = isGujaratiWord ? 'gu-IN' : 'en-US';
    utterance.rate = 0.9; // Slightly slower for clear student learning
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Toggle Save Word to My Vocabulary
  const handleToggleSave = async () => {
    if (!entry) return;
    setSavingAction(true);

    try {
      if (isSaved && savedWordId) {
        // Remove from saved
        await api.delete(`/ai-dictionary/saved/${savedWordId}`);
        setIsSaved(false);
        setSavedWordId(null);
        setSavedWords(prev => prev.filter(w => w.id !== savedWordId));
      } else {
        // Add to saved
        const res = await api.post('/ai-dictionary/saved', {
          word: entry.word,
          meaning: entry.meaning,
          pronunciation: entry.pronunciation,
          partOfSpeech: entry.partOfSpeech,
          simpleMeaning: entry.simpleMeaning,
          detailedMeaning: entry.detailedMeaning,
          exampleSentences: entry.exampleSentences,
          synonyms: entry.synonyms,
          antonyms: entry.antonyms,
          relatedWords: entry.relatedWords,
          explainSimply: entry.explainSimply,
          explainForExam: entry.explainForExam,
          meaningGu: entry.meaningGu,
          simpleMeaningGu: entry.simpleMeaningGu,
          language: i18n.language || 'en',
          subject: entry.subject || (selectedSubject !== 'ALL' ? selectedSubject : undefined),
          chapter: entry.chapter || chapterFilter || undefined,
          topic: entry.topic || topicFilter || undefined
        });

        if (res.data?.savedWord) {
          setIsSaved(true);
          setSavedWordId(res.data.savedWord.id);
          fetchSavedWords();
        }
      }
    } catch (err: any) {
      console.error('Failed to toggle saved word:', err);
    } finally {
      setSavingAction(false);
    }
  };

  // Copy Meaning to Clipboard
  const handleCopyMeaning = () => {
    if (!entry) return;
    const textToCopy = `${entry.word} (${entry.partOfSpeech || 'Word'}) [${entry.pronunciation}]\n` +
      `Meaning: ${entry.meaning}\n` +
      (entry.meaningGu ? `ગુજરાતી અર્થ: ${entry.meaningGu}\n` : '') +
      `Simple Explanation: ${entry.simpleMeaning}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Clear Search Input
  const handleClear = () => {
    setSearchQuery('');
    setSearchedWord(null);
    setEntry(null);
    setNotFound(false);
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      p.delete('word');
      return p;
    });
  };

  // Clear Recent Searches
  const handleClearHistory = async () => {
    try {
      await api.delete('/ai-dictionary/recent');
      setRecentSearches([]);
    } catch (err) {}
  };

  // Remove word from Vocabulary
  const handleRemoveVocabWord = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/ai-dictionary/saved/${id}`);
      setSavedWords(prev => prev.filter(w => w.id !== id));
      if (savedWordId === id) {
        setIsSaved(false);
        setSavedWordId(null);
      }
    } catch (err) {}
  };

  // Open saved word directly in dictionary
  const handleOpenSavedWord = (w: SavedWordItem) => {
    setSearchQuery(w.word);
    if (w.subject) setSelectedSubject(w.subject);
    handleSearch(w.word, w.subject || 'ALL');
  };

  // Filtered Saved Words for My Vocabulary tab
  const filteredSavedWords = savedWords.filter(item => {
    const matchesSubject = vocabSubjectFilter === 'ALL' || item.subject === vocabSubjectFilter;
    const query = vocabSearchFilter.toLowerCase();
    const matchesQuery = !query ||
      item.word.toLowerCase().includes(query) ||
      item.meaning.toLowerCase().includes(query) ||
      (item.meaningGu && item.meaningGu.includes(query));
    return matchesSubject && matchesQuery;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/20 p-6 sm:p-8 backdrop-blur-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider">
              <BookA className="w-4 h-4 text-blue-400" />
              <span>{tr('વિદ્યાર્થી AI શબ્દકોશ', 'Student AI Dictionary', 'विद्यार्थी एआई शब्दकोश')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {tr('AI શબ્દકોશ અને શૈક્ષણિક પરિભાષા', 'AI Dictionary & Academic Lexicon', 'एआई शब्दकोश और शैक्षणिक शब्दावली')}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              {tr(
                'કોઈપણ વિષયનો શબ્દ શોધો અને મેળવો સાચો ઉચ્ચાર, સરળ સમજૂતી, NCERT પરીક્ષા મુદ્દાઓ અને ગુજરાતી અનુવાદ.',
                'Look up any academic or curriculum word for instant definitions, phonetic pronunciation, simple analogies, exam tips, and Gujarati meanings.',
                'किसी भी शैक्षणिक शब्द को खोजें और तुरंत सटीक उच्चारण, सरल व्याख्या, परीक्षा टिप्स और अर्थ प्राप्त करें।'
              )}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 self-start md:self-auto shrink-0 shadow-lg">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'search'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>{tr('શબ્દ શોધો', 'Dictionary Search', 'शब्द खोज')}</span>
            </button>
            <button
              onClick={() => setActiveTab('vocabulary')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all relative ${
                activeTab === 'vocabulary'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{tr('મારી શબ્દાવલી', 'My Vocabulary', 'मेरी शब्दावली')}</span>
              {savedWords.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-indigo-500/30 border border-indigo-400/40 text-[10px] rounded-full font-bold">
                  {savedWords.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'search' ? (
        <div className="space-y-6">
          {/* Search Box & Context Selectors */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={tr(
                    'શબ્દ લખો (દા.ત. Photosynthesis, Polynomial, Gravity, પ્રકાશસંશ્લેષણ)...',
                    'Search a word (e.g. Photosynthesis, Polynomial, Gravity, Cell, Constitution)...',
                    'शब्द लिखें (उदा. Photosynthesis, Polynomial, Gravity)...'
                  )}
                  className="w-full pl-12 pr-10 py-3.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={handleClear}
                    title={tr('સાફ કરો', 'Clear')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-md transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Subject selector */}
              <div className="w-full sm:w-48 shrink-0">
                <select
                  value={selectedSubject}
                  onChange={(e) => {
                    setSelectedSubject(e.target.value);
                    if (searchQuery.trim()) handleSearch(searchQuery, e.target.value);
                  }}
                  className="w-full py-3.5 px-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="ALL">{tr('તમામ વિષયો (All)', 'All Subjects')}</option>
                  {TEACHER_SUBJECTS.map((s) => (
                    <option key={s.name} value={s.name}>
                      {isGu ? s.nameGu : s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search button */}
              <button
                onClick={() => handleSearch()}
                disabled={loading || !searchQuery.trim()}
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>{tr('શોધો', 'Search', 'खोजें')}</span>
                  </>
                )}
              </button>
            </div>

            {/* Context Expansion Button */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <button
                type="button"
                onClick={() => setShowContextFilters(!showContextFilters)}
                className="inline-flex items-center space-x-1 text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>
                  {showContextFilters
                    ? tr('પ્રકરણ/ટોપિક સંદર્ભ છુપાવો', 'Hide Academic Context Filters')
                    : tr('+ પ્રકરણ / ટોપિક સંદર્ભ ઉમેરો', '+ Add Chapter & Topic Context')}
                </span>
              </button>
            </div>

            {/* Optional Academic Chapter & Topic Filters */}
            {showContextFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800 animate-fadeIn">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    {tr('પ્રકરણ (Chapter)', 'Chapter (Optional)')}
                  </label>
                  <input
                    type="text"
                    value={chapterFilter}
                    onChange={(e) => setChapterFilter(e.target.value)}
                    placeholder={tr('દા.ત. Life Processes, Force...', 'e.g. Life Processes, Force and Pressure...')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    {tr('મુદ્દો (Topic)', 'Topic (Optional)')}
                  </label>
                  <input
                    type="text"
                    value={topicFilter}
                    onChange={(e) => setTopicFilter(e.target.value)}
                    placeholder={tr('દા.ત. Chloroplast, Nutrition...', 'e.g. Chloroplasts, Types of friction...')}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Recent Searches Row */}
            {recentSearches.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800/80">
                <span className="text-xs text-slate-400 flex items-center space-x-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{tr('તાજેતરની શોધ:', 'Recent:', 'हाल की खोज:')}</span>
                </span>
                {recentSearches.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSearchQuery(item.word);
                      handleSearch(item.word);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/60 text-xs text-slate-300 hover:text-white transition-all flex items-center space-x-1"
                  >
                    <span>{item.word}</span>
                  </button>
                ))}
                <button
                  onClick={handleClearHistory}
                  title={tr('ઇતિહાસ સાફ કરો', 'Clear search history')}
                  className="ml-auto text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {tr('ઇતિહાસ સાફ કરો', 'Clear History')}
                </button>
              </div>
            )}
          </div>

          {/* Not Found State */}
          {notFound && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 sm:p-8 text-center space-y-4">
              <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-amber-300">
                  {notFoundMessage}
                </h3>
                <p className="text-xs text-slate-400">
                  {tr(
                    'અહીં સામાન્ય શૈક્ષણિક વિષયના કેટલાક શબ્દો આપેલા છે, તેમાંથી પસંદ કરો:',
                    'Explore these standard academic concepts below:',
                    'नीचे दिए गए मानक शैक्षणिक शब्दों में से चुनें:'
                  )}
                </p>
              </div>
              {suggestions.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  {suggestions.map((sug) => (
                    <button
                      key={sug}
                      onClick={() => {
                        setSearchQuery(sug);
                        handleSearch(sug);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-blue-600 border border-slate-700 hover:border-blue-500 text-xs font-semibold text-slate-200 hover:text-white transition-all"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Dictionary Result Card */}
          {entry && (
            <div className="space-y-6 animate-fadeIn">
              {/* Primary Word Banner Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                        {entry.word}
                      </h2>
                      {entry.partOfSpeech && (
                        <span className="px-2.5 py-1 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider">
                          {entry.partOfSpeech}
                        </span>
                      )}
                      {entry.subject && (
                        <span className="px-2.5 py-1 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-semibold">
                          {entry.subject}
                        </span>
                      )}
                    </div>

                    {/* Phonetic & Pronunciation audio */}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      {entry.phonetic && (
                        <span className="text-sm font-mono text-slate-400">
                          {entry.phonetic}
                        </span>
                      )}

                      {entry.pronunciation && (
                        <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-medium">
                          {tr('ઉચ્ચાર:', 'Say:')} <span className="font-semibold text-white">{entry.pronunciation}</span>
                        </span>
                      )}

                      {/* Listen Button */}
                      <button
                        onClick={() => handleSpeak(entry.word)}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                          isSpeaking
                            ? 'bg-amber-500 text-slate-950 animate-pulse'
                            : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30'
                        }`}
                        title={tr('ઉચ્ચાર સાંભળો', 'Listen to pronunciation', 'उच्चारण सुनें')}
                      >
                        {isSpeaking ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5" />
                            <span>{tr('બોલાઈ રહ્યું છે...', 'Speaking...')}</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>{tr('સાંભળો', 'Listen', 'सुनें')}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Actions: Save & Copy */}
                  <div className="flex items-center gap-2 self-start">
                    <button
                      onClick={handleCopyMeaning}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
                      title={tr('અર્થ કોપી કરો', 'Copy definition')}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">{tr('કોપી થઈ ગયું!', 'Copied!')}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{tr('કોપી', 'Copy')}</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleToggleSave}
                      disabled={savingAction}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm border ${
                        isSaved
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                          : 'bg-indigo-600/20 border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30'
                      }`}
                    >
                      {isSaved ? (
                        <>
                          <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{tr('સાચવેલ છે', 'Saved in Vocab')}</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{tr('શબ્દાવલીમાં સાચવો', 'Save to Vocab')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Primary Meaning Description */}
                <div className="mt-5 space-y-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      {tr('મુખ્ય વ્યાખ્યા', 'Standard Definition', 'मुख्य परिभाषा')}
                    </span>
                    <p className="text-sm sm:text-base text-slate-100 font-normal leading-relaxed">
                      {isGu && entry.meaningGu ? entry.meaningGu : entry.meaning}
                    </p>
                  </div>

                  {(entry.simpleMeaning || entry.simpleMeaningGu) && (
                    <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-900/40">
                      <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center space-x-1 mb-1">
                        <Lightbulb className="w-3 h-3 text-amber-400" />
                        <span>{tr('સરળ શબ્દોમાં', 'In Simple Words', 'सरल शब्दों में')}</span>
                      </span>
                      <p className="text-xs sm:text-sm text-slate-200">
                        {isGu && entry.simpleMeaningGu ? entry.simpleMeaningGu : entry.simpleMeaning}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Explanations Section: "Explain Simply" vs "Explain for Exam" */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-bold text-base text-white">
                      {tr('AI શૈક્ષણિક વિશ્લેષણ', 'AI Educational Perspectives')}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                    <button
                      onClick={() => setExplanationMode('simple')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                        explanationMode === 'simple'
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>{tr('સરળ સમજૂતી', 'Explain Simply', 'सरल व्याख्या')}</span>
                    </button>
                    <button
                      onClick={() => setExplanationMode('exam')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                        explanationMode === 'exam'
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>{tr('પરીક્ષા લક્ષી સમજૂતી', 'Explain for Exam', 'परीक्षा व्याख्या')}</span>
                    </button>
                  </div>
                </div>

                {/* Perspective View Content */}
                {explanationMode === 'simple' ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-indigo-500/20 space-y-2">
                      <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                        <Lightbulb className="w-4 h-4 text-amber-400" />
                        <span>{tr('સાહજિક ઉપમા અને મોડેલ', 'Intuitive Real-World Mental Model', 'सहज मानसिक मॉडल')}</span>
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                        {isGu && entry.explainSimplyGu ? entry.explainSimplyGu : entry.explainSimply}
                      </p>
                    </div>

                    {(entry.detailedMeaning || entry.detailedMeaningGu) && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          {tr('વિગતવાર વિવરણ', 'Detailed Mechanism', 'विस्तृत विवरण')}
                        </span>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          {isGu && entry.detailedMeaningGu ? entry.detailedMeaningGu : entry.detailedMeaning}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 to-slate-900 border border-blue-500/20 space-y-3">
                      <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
                        <GraduationCap className="w-4 h-4 text-blue-400" />
                        <span>{tr('NCERT પરીક્ષા સ્કોરિંગ માર્ગદર્શન', 'NCERT Curriculum & Exam Scoring Blueprint', 'एनसीईआरटी परीक्षा ब्लूप्रिंट')}</span>
                      </div>
                      <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
                        {isGu && entry.explainForExamGu ? entry.explainForExamGu : entry.explainForExam}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Example Sentences */}
              {entry.exampleSentences && entry.exampleSentences.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-bold text-sm text-white">
                      {tr('ઉદાહરણ વાક્યો', 'Example Sentences', 'उदाहरण वाक्य')}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(isGu && entry.exampleSentencesGu && entry.exampleSentencesGu.length > 0
                      ? entry.exampleSentencesGu
                      : entry.exampleSentences
                    ).map((example, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-start space-x-2">
                          <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                            {example}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Relationships Grid: Synonyms, Antonyms, Related Terms */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Synonyms */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>{tr('સમાનાર્થી શબ્દો', 'Synonyms', 'समानार्थी शब्द')}</span>
                  </h4>
                  {(() => {
                    const synList = (isGu && entry.synonymsGu && entry.synonymsGu.length > 0)
                      ? entry.synonymsGu
                      : entry.synonyms;
                    return synList && synList.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {synList.map((syn, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setSearchQuery(syn);
                              handleSearch(syn);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-xs font-semibold text-emerald-300 hover:text-emerald-200 transition-all"
                          >
                            {syn}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">{tr('કોઈ ઉપલબ્ધ નથી', 'None specified', 'कोई नहीं')}</p>
                    );
                  })()}
                </div>

                {/* Antonyms */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span>{tr('વિરોધી શબ્દો', 'Antonyms', 'विलोम शब्द')}</span>
                  </h4>
                  {(() => {
                    const antList = (isGu && entry.antonymsGu && entry.antonymsGu.length > 0)
                      ? entry.antonymsGu
                      : entry.antonyms;
                    return antList && antList.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {antList.map((ant, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setSearchQuery(ant);
                              handleSearch(ant);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-semibold text-rose-300 hover:text-rose-200 transition-all"
                          >
                            {ant}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">{tr('કોઈ ઉપલબ્ધ નથી', 'None specified', 'कोई नहीं')}</p>
                    );
                  })()}
                </div>

                {/* Related Words */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span>{tr('સંબંધિત સંકલ્પનાઓ', 'Related Concepts', 'संबंधित अवधारणाएं')}</span>
                  </h4>
                  {(() => {
                    const relList = (isGu && entry.relatedWordsGu && entry.relatedWordsGu.length > 0)
                      ? entry.relatedWordsGu
                      : entry.relatedWords;
                    return relList && relList.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {relList.map((rel, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setSearchQuery(rel);
                              handleSearch(rel);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-xs font-semibold text-blue-300 hover:text-blue-200 transition-all flex items-center space-x-1"
                          >
                            <span>{rel}</span>
                            <ArrowRight className="w-2.5 h-2.5 opacity-60" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">{tr('કોઈ ઉપલબ્ધ નથી', 'None specified', 'कोई नहीं')}</p>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* My Vocabulary Tab */
        <div className="space-y-6 animate-fadeIn">
          {/* Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={vocabSearchFilter}
                onChange={(e) => setVocabSearchFilter(e.target.value)}
                placeholder={tr('શબ્દાવલીમાં શોધો...', 'Filter saved vocabulary by word or meaning...')}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="w-full sm:w-48 shrink-0">
              <select
                value={vocabSubjectFilter}
                onChange={(e) => setVocabSubjectFilter(e.target.value)}
                className="w-full py-2.5 px-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">{tr('તમામ વિષયો (All)', 'All Subjects')}</option>
                {TEACHER_SUBJECTS.map((s) => (
                  <option key={s.name} value={s.name}>
                    {isGu ? s.nameGu : s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Saved Words List */}
          {loadingSaved ? (
            <div className="flex items-center justify-center p-12">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredSavedWords.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSavedWords.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenSavedWord(item)}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-5 shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                          {item.word}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {item.partOfSpeech && (
                            <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-semibold uppercase">
                              {item.partOfSpeech}
                            </span>
                          )}
                          {item.pronunciation && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              /{item.pronunciation}/
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSpeak(item.word);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title={tr('ઉચ્ચાર સાંભળો', 'Listen')}
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveVocabWord(item.id, e)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title={tr('શબ્દ દૂર કરો', 'Remove from vocabulary')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                      {isGu && item.meaningGu ? item.meaningGu : item.meaning}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center space-x-1.5">
                      {item.subject && (
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium">
                          {item.subject}
                        </span>
                      )}
                    </div>
                    <span className="flex items-center space-x-1 text-blue-400 group-hover:translate-x-0.5 transition-transform font-semibold">
                      <span>{tr('વિગતો જુઓ', 'View')}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto">
                <Bookmark className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  {tr('હજી સુધી કોઈ શબ્દો સાચવ્યા નથી', 'No saved words in your vocabulary yet')}
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {tr(
                    'અભ્યાસ કરતી વખતે કોઈપણ અઘરા શબ્દને "શબ્દાવલીમાં સાચવો" પર ક્લિક કરીને અહીં સંગ્રહિત કરો જેથી પરીક્ષા પહેલાં ઝડપી પુનરાવર્તન થઈ શકે.',
                    'Bookmark challenging curriculum terms by clicking "Save to Vocab" so you can easily review them before exams.',
                    'कठिन शब्दों को यहां सहेजें ताकि परीक्षा से पहले तेजी से रिवीजन कर सकें।'
                  )}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('search')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md inline-flex items-center space-x-2"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{tr('શબ્દો શોધો', 'Search Words Now')}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AiDictionaryPage;
