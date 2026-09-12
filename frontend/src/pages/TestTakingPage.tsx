import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ActiveTest } from '../types';
import { useTranslation } from 'react-i18next';
import { Clock, Bookmark, ChevronLeft, ChevronRight } from 'lucide-react';

export const TestTakingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['tests', 'common']);

  const isGu = i18n.language === 'gu';

  const [test, setTest] = useState<ActiveTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Student answer state: { [questionId: string]: selectedOptionId }
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: string]: string }>({});
  // Question start time tracking
  const [questionStartTimes, setQuestionStartTimes] = useState<{ [qId: string]: number }>({});
  const [questionTimes, setQuestionTimes] = useState<{ [qId: string]: number }>({});

  // Marked for review questions
  const [markedQuestions, setMarkedQuestions] = useState<{ [qId: string]: boolean }>({});

  // Timer state in seconds
  const [secondsRemaining, setSecondsRemaining] = useState<number>(1800);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const res = await api.get(`/tests/${id}`, {
          params: { lang: isGu ? 'gu' : 'en' }
        });
        const activeTest: ActiveTest = res.data.test;
        setTest(activeTest);
        setSecondsRemaining(activeTest.durationMinutes * 60);

        if (activeTest.questions.length > 0) {
          const now = Date.now();
          setQuestionStartTimes({ [activeTest.questions[0].id]: now });
        }
      } catch (err) {
        console.error('Failed to load test details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
  }, [id, i18n.language]);

  // Countdown timer effect
  useEffect(() => {
    if (secondsRemaining <= 0 && test && !submitting) {
      handleFinalSubmit();
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining, test, submitting]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const toggleMarkForReview = (questionId: string) => {
    setMarkedQuestions(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleNextQuestion = () => {
    if (!test) return;
    const currentQ = test.questions[currentIndex];
    const now = Date.now();
    const elapsedSecs = Math.round((now - (questionStartTimes[currentQ.id] || now)) / 1000);

    setQuestionTimes(prev => ({ ...prev, [currentQ.id]: (prev[currentQ.id] || 0) + elapsedSecs }));

    if (currentIndex < test.questions.length - 1) {
      const nextQ = test.questions[currentIndex + 1];
      setQuestionStartTimes(prev => ({ ...prev, [nextQ.id]: Date.now() }));
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (!test) return;
    if (currentIndex > 0) {
      const prevQ = test.questions[currentIndex - 1];
      setQuestionStartTimes(prev => ({ ...prev, [prevQ.id]: Date.now() }));
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleFinalSubmit = async () => {
    if (!test || submitting) return;
    setSubmitting(true);

    try {
      const totalTimeSpentSeconds = test.durationMinutes * 60 - Math.max(0, secondsRemaining);

      const formattedAnswers = test.questions.map(q => ({
        questionId: q.id,
        selectedOptionId: selectedAnswers[q.id] || undefined,
        timeTakenSeconds: questionTimes[q.id] || 15
      }));

      const res = await api.post(`/tests/${test.id}/submit`, {
        answers: formattedAnswers,
        timeTakenSeconds: totalTimeSpentSeconds
      });

      // Navigate to Result Analysis Page with state
      navigate(`/tests/${test.id}/results`, { state: { result: res.data.result } });
    } catch (err) {
      console.error('Failed to submit test attempt:', err);
      setSubmitting(false);
    }
  };

  if (loading || !test) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-400">{t('common:loading')}</p>
        </div>
      </div>
    );
  }

  const currentQ = test.questions[currentIndex];
  const minutesLeft = Math.floor(secondsRemaining / 60);
  const secondsLeft = secondsRemaining % 60;
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Top Test Header */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-8 flex items-center justify-between sticky top-0 z-30">
        <div>
          <h2 className="font-bold text-base text-white">
            {isGu ? (test.titleGu || test.title) : test.title}
          </h2>
          <p className="text-xs text-blue-400">
            {isGu ? (test.subjectNameGu || test.subjectName) : test.subjectName} • {isGu ? t(`common:difficulty.${test.difficulty}`, test.difficulty) : test.difficulty}
          </p>
        </div>

        {/* Live Timer */}
        <div className="flex items-center space-x-6">
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl border font-mono font-bold text-sm ${
            secondsRemaining < 300
              ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
              : 'bg-slate-800 border-slate-700 text-slate-200'
          }`}>
            <Clock className="w-4 h-4" />
            <span>{t('timeRemaining')}: {String(minutesLeft).padStart(2, '0')}:{String(secondsLeft).padStart(2, '0')}</span>
          </div>

          <button
            onClick={handleFinalSubmit}
            disabled={submitting}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
          >
            {submitting ? t('common:saving') : t('submitTest')}
          </button>
        </div>
      </header>

      {/* Main Exam Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Question & Options Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Question Header Info */}
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <span className="text-xs font-bold text-slate-400">
              {t('question')} {currentIndex + 1} / {test.questions.length}
            </span>
            <div className="flex items-center space-x-3">
              <span className="text-[10px] font-bold uppercase text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg">
                {isGu ? 'મુદ્દો: ' : 'Topic: '}{isGu ? (currentQ.topicNameGu || currentQ.topicName) : currentQ.topicName}
              </span>
              <button
                onClick={() => toggleMarkForReview(currentQ.id)}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  markedQuestions[currentQ.id]
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{t('markForReview')}</span>
              </button>
            </div>
          </div>

          {/* Question Text Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <h3 className="text-lg font-semibold text-white leading-relaxed">
              {isGu ? (currentQ.questionTextGu || currentQ.questionText) : currentQ.questionText}
            </h3>

            {/* Options List */}
            <div className="space-y-3">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedAnswers[currentQ.id] === opt.id;
                const optionLabel = String.fromCharCode(65 + idx);

                return (
                  <div
                    key={opt.id}
                    onClick={() => handleSelectOption(currentQ.id, opt.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center space-x-4 ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                        : 'bg-slate-800/60 border-slate-700/70 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {optionLabel}
                    </div>
                    <span className="text-sm font-medium">
                      {isGu ? (opt.optionTextGu || opt.optionText) : opt.optionText}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevQuestion}
              disabled={currentIndex === 0}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 flex items-center space-x-2 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{t('previous')}</span>
            </button>

            <button
              onClick={handleNextQuestion}
              disabled={currentIndex === test.questions.length - 1}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center space-x-2 transition-all"
            >
              <span>{t('next')}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Question Palette Sidebar */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 h-fit">
          <h4 className="font-bold text-sm text-white border-b border-slate-800 pb-3">
            {t('question')} ({answeredCount}/{test.questions.length})
          </h4>

          {/* Palette Grid */}
          <div className="grid grid-cols-5 gap-2.5">
            {test.questions.map((q, idx) => {
              const isCurrent = idx === currentIndex;
              const isAns = Boolean(selectedAnswers[q.id]);
              const isMarked = Boolean(markedQuestions[q.id]);

              let btnStyle = 'bg-slate-800 text-slate-400 border-slate-700';
              if (isAns) btnStyle = 'bg-emerald-600/30 text-emerald-400 border-emerald-500/40 font-bold';
              if (isMarked) btnStyle = 'bg-amber-500/30 text-amber-400 border-amber-500/40 font-bold';
              if (isCurrent) btnStyle += ' ring-2 ring-blue-500 border-blue-500';

              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setQuestionStartTimes(prev => ({ ...prev, [q.id]: Date.now() }));
                  }}
                  className={`h-10 rounded-xl text-xs border transition-all flex items-center justify-center font-bold ${btnStyle}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Palette Legend */}
          <div className="space-y-2 text-[11px] text-slate-400 border-t border-slate-800 pt-4">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500/40 border border-emerald-500" />
              <span>{isGu ? 'જવાબ આપેલ' : 'Answered'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-amber-500/40 border border-amber-500" />
              <span>{t('markForReview')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-slate-800 border border-slate-700" />
              <span>{t('unanswered')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
