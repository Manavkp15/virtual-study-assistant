import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { MistakeEntry } from '../types';
import { useTranslation } from 'react-i18next';
import { tr, trSubject, trItem } from '../utils/tr';
import { AlertTriangle, CheckCircle2, Search } from 'lucide-react';
import { StepByStepSolutionCard } from '../components/StepByStepSolutionCard';

export const MistakeBookPage: React.FC = () => {
  const { t, i18n } = useTranslation(['mistakes', 'common']);
  const [mistakes, setMistakes] = useState<MistakeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  useEffect(() => {
    const fetchMistakes = async () => {
      try {
        const res = await api.get('/mistakes', {
          params: { lang: i18n.language || 'en' }
        });
        setMistakes(res.data.mistakes || []);
      } catch (err) {
        console.error('Failed to load mistake book:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMistakes();
  }, [i18n.language]);

  const handleToggleResolve = async (id: string) => {
    try {
      await api.patch(`/mistakes/${id}/resolve`);
      setMistakes(prev => prev.map(m => m.id === id ? { ...m, isResolved: !m.isResolved } : m));
    } catch (err) {
      console.error('Failed to update mistake status:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredMistakes = mistakes.filter(m => {
    if (filterType === 'REPEATED' && !m.isRepeatedMistake) return false;
    if (filterType === 'RESOLVED' && !m.isResolved) return false;
    if (filterType === 'UNRESOLVED' && m.isResolved) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const qText = trItem(m.questionTextGu, m.questionText).toLowerCase();
      const tName = trItem(m.topicNameGu, m.topicName).toLowerCase();
      const sName = trSubject({ name: m.subjectName, nameGu: m.subjectNameGu }).toLowerCase();
      return qText.includes(q) || tName.includes(q) || sName.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-3">
            <AlertTriangle className="w-7 h-7 text-amber-400" />
            <span>{t('title')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t('subtitle')}
          </p>
        </div>

        {/* Filter and Search Controls */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tr('પ્રશ્ન અથવા વિષય શોધો...', 'Search question or topic...')}
              className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-48"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">{t('common:all')} ({mistakes.length})</option>
            <option value="REPEATED">⚠️ {t('repeatedMistakes')}</option>
            <option value="UNRESOLVED">{t('pending')}</option>
            <option value="RESOLVED">{t('resolved')}</option>
          </select>
        </div>
      </div>

      {/* Mistake Entries List */}
      <div className="space-y-4">
        {filteredMistakes.length === 0 ? (
          <div className="p-12 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400 text-xs">
            {tr('🎉 તમારા ફિલ્ટર સાથે મેળ ખાતી કોઈ ભૂલો મળી નથી!', '🎉 No mistake entries found matching your filter!')}
          </div>
        ) : (
          filteredMistakes.map((m) => (
            <div
              key={m.id}
              className={`bg-slate-900 border rounded-2xl p-6 shadow-sm space-y-4 transition-all ${
                m.isRepeatedMistake
                  ? 'border-red-500/40 bg-red-950/10'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    {trSubject({ name: m.subjectName, nameGu: m.subjectNameGu })} → {trItem(m.topicNameGu, m.topicName)}
                  </span>
                  {m.isRepeatedMistake && (
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{t('repeatedMistakes')} ({m.incorrectCount}{tr(' વખત', 'x')})</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-xs text-slate-500">{new Date(m.lastAttemptedAt).toLocaleDateString()}</span>
                  <button
                    onClick={() => handleToggleResolve(m.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-1.5 ${
                      m.isResolved
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{m.isResolved ? t('resolved') : t('markResolved')}</span>
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <h3 className="font-semibold text-base text-white">
                {trItem(m.questionTextGu, m.questionText)}
              </h3>

              {/* Answer comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-800/50 p-4 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-slate-400 font-medium">{t('yourAnswer')}: </span>
                  <span className="font-bold text-red-400">
                    {trItem(m.studentAnswerGu, m.studentAnswer)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">{t('correctAnswer')}: </span>
                  <span className="font-bold text-emerald-400">
                    {trItem(m.correctAnswerGu, m.correctAnswer)}
                  </span>
                </div>
              </div>

              {/* Step-by-Step Solution & Concept Reasoning */}
              {m.stepByStepSolution ? (
                <StepByStepSolutionCard
                  solution={m.stepByStepSolution}
                  questionText={m.questionText}
                  explanationFallback={m.explanation}
                  explanationFallbackGu={m.explanationGu}
                />
              ) : (m.explanationGu || m.explanation) ? (
                <div className="text-xs text-slate-300 bg-slate-800/20 p-3 rounded-xl border border-slate-800">
                  <strong className="text-blue-400">{t('solutionExplanation')}: </strong>
                  {trItem(m.explanationGu, m.explanation)}
                </div>
              ) : null}

              <p className="text-xs text-amber-400 font-medium italic">
                "{trItem(m.recommendationGu, m.recommendation)}"
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
