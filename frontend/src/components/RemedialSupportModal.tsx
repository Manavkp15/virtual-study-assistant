import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import {
  HeartHandshake,
  Sparkles,
  BookOpen,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Award,
  ChevronRight,
  FileText,
  Video,
  X,
  TrendingUp,
  Brain
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { tr, trSubject, trItem } from '../utils/tr';
import { RemedialQuestion, RemedialResult } from '../types';
import { StepByStepSolutionCard } from './StepByStepSolutionCard';

interface RemedialSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  attemptId?: string;
  existingSessionId?: string;
  initialWeakChapter?: any;
  initialWeakTopics?: any[];
  onRemedialComplete?: (result: RemedialResult) => void;
}

type ModalPhase = 'PROMPT' | 'REVISION' | 'TEST' | 'REPORT';

export const RemedialSupportModal: React.FC<RemedialSupportModalProps> = ({
  isOpen,
  onClose,
  attemptId,
  existingSessionId,
  initialWeakChapter,
  initialWeakTopics,
  onRemedialComplete
}) => {
  const { t, i18n } = useTranslation(['tests', 'common']);
  const isGu = i18n.language === 'gu';

  const [phase, setPhase] = useState<ModalPhase>('PROMPT');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any | null>(null);

  // Test State
  const [questions, setQuestions] = useState<RemedialQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes
  const [timerActive, setTimerActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Result State
  const [remedialResult, setRemedialResult] = useState<RemedialResult | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize or fetch remedial session
  useEffect(() => {
    if (!isOpen) return;

    const initSession = async () => {
      setLoading(true);
      try {
        if (existingSessionId) {
          const res = await api.get(`/remedial/session/${existingSessionId}`);
          setSession(res.data.session);
        } else if (attemptId) {
          const res = await api.post(`/remedial/create-from-attempt/${attemptId}`);
          setSession(res.data.session);
        }
      } catch (err) {
        console.error('Failed to initialize remedial session:', err);
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, [isOpen, attemptId, existingSessionId]);

  // Countdown timer logic during remedial test
  useEffect(() => {
    if (phase === 'TEST' && timerActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (phase === 'TEST' && timeLeft === 0 && timerActive) {
      // Auto-submit when time expires
      handleSubmitTest();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase, timerActive, timeLeft]);

  if (!isOpen) return null;

  const handleStartRevision = async () => {
    if (!session?.id) return;
    setLoading(true);
    try {
      const res = await api.get(`/remedial/session/${session.id}`);
      setSession(res.data.session);
      setPhase('REVISION');
    } catch (err) {
      console.error('Failed to load revision notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async () => {
    if (!session?.id) return;
    setLoading(true);
    try {
      const res = await api.get(`/remedial/session/${session.id}/test`);
      setQuestions(res.data.questions || []);
      setTimeLeft(res.data.durationSeconds || 300);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setPhase('TEST');
      setTimerActive(true);
    } catch (err) {
      console.error('Failed to generate remedial test:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmitTest = async () => {
    if (!session?.id || submitting) return;
    setSubmitting(true);
    setTimerActive(false);

    try {
      const formattedAnswers = questions.map(q => ({
        questionId: q.id,
        selectedOptionId: selectedAnswers[q.id] || null
      }));

      const timeTaken = 300 - timeLeft;
      const res = await api.post(`/remedial/session/${session.id}/submit`, {
        answers: formattedAnswers,
        timeTakenSeconds: timeTaken > 0 ? timeTaken : 30
      });

      setRemedialResult(res.data.result);
      setPhase('REPORT');
      onRemedialComplete?.(res.data.result);
    } catch (err) {
      console.error('Failed to submit remedial test:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const chapterTitle = session?.chapter?.name || initialWeakChapter?.name || 'Weak Chapter';
  const chapterTitleGu = session?.chapter?.nameGu || initialWeakChapter?.nameGu || chapterTitle;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 rounded-xl">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>{tr('AI સુધારાત્મક સહાય પ્રણાલી', 'AI Remedial Support System')}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  {tr('સહાયક પુનરાવર્તન', 'Supportive Revision')}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {trItem(chapterTitleGu, chapterTitle)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* ========================================================= */}
          {/* PHASE 1: FRIENDLY SUPPORT PROMPT                          */}
          {/* ========================================================= */}
          {phase === 'PROMPT' && (
            <div className="space-y-6 text-center">
              <div className="inline-flex p-4 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-orange-500/10 to-blue-500/20 border border-amber-500/30 shadow-lg shadow-amber-500/10 text-amber-400">
                <Sparkles className="w-12 h-12 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-white">
                  {tr(
                    'ચાલો આ વિષયને સુધારીએ! તમને આ પ્રકરણમાં થોડી વધુ પ્રેક્ટિસની જરૂર પડી શકે છે.',
                    "Let's improve this topic! You may need a little more practice with this chapter."
                  )}
                </h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  {tr(
                    'દરેક ભૂલ એ શીખવાની તક છે. અમે તમારા માટે આ પ્રકરણના મુખ્ય સિદ્ધાંતો અને ટૂંકી ટેસ્ટ તૈયાર કરી છે.',
                    'Every mistake is an opportunity to learn. We have prepared key chapter concepts and a supportive mini-test to help you level up.'
                  )}
                </p>
              </div>

              {/* Weak Chapter & Score Badge */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-left space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">{tr('ધ્યાન આપવાની જરૂર હોય તેવું પ્રકરણ:', 'Focus Chapter:')}</span>
                  <span className="font-bold text-amber-400 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    {trItem(chapterTitleGu, chapterTitle)}
                  </span>
                </div>

                {session?.initialPercentage !== undefined && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-700/60">
                    <span className="text-slate-400">{tr('છેલ્લા પ્રયાસનો સ્કોર:', 'Previous Quiz Score:')}</span>
                    <span className="font-bold text-red-400">{session.initialPercentage}%</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleStartRevision}
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/30 flex items-center justify-center space-x-2 transition-all"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>{tr('પ્રકરણનું પુનરાવર્તન કરો (Revise Chapter)', 'Revise Chapter')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 transition-colors"
                >
                  {tr('હું પછીથી પુનરાવર્તન કરીશ', "I'll Revise Later")}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PHASE 2: CHAPTER REVISION & CONCEPT NOTES                 */}
          {/* ========================================================= */}
          {phase === 'REVISION' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                <div className="flex items-center space-x-3">
                  <BookOpen className="w-5 h-5 text-amber-400" />
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {trItem(chapterTitleGu, chapterTitle)} - {tr('અધ્યયન મુદ્દાઓ', 'Key Concepts & Revision')}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {tr('મૂળભૂત સિદ્ધાંતો ધ્યાનપૂર્વક વાંચો અને પછી પ્રેક્ટિસ ટેસ્ટ શરૂ કરો.', 'Review the essential points carefully, then take the remedial test.')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Revision Notes Content */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
                {isGu
                  ? (session?.revisionNotesGu || session?.revisionNotes)
                  : (session?.revisionNotes || session?.revisionNotesGu)}
              </div>

              {/* Connected Teacher Study Materials (if any) */}
              {session?.studyMaterials && session.studyMaterials.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 flex items-center space-x-1.5">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span>{tr('શિક્ષક દ્વારા અપલોડ કરાયેલ સંદર્ભ સાહિત્ય:', 'Teacher Study Materials:')}</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {session.studyMaterials.map((mat: any) => (
                      <div key={mat.id} className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl flex items-center justify-between text-xs">
                        <span className="truncate font-medium text-slate-200">{trItem(mat.titleGu, mat.title)}</span>
                        {mat.pdfFilePath && (
                          <a
                            href={mat.pdfFilePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-[11px] font-bold underline shrink-0 ml-2"
                          >
                            {tr('PDF જુઓ', 'View PDF')}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ready to Test Callout */}
              <div className="p-4 bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-purple-950/40 border border-blue-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h5 className="font-bold text-xs text-white">
                    {tr('પુનરાવર્તન પૂરું થયું? તમારી જાતને ચકાસો!', 'Finished revision? Test yourself!')}
                  </h5>
                  <p className="text-[11px] text-slate-400">
                    {tr('૫ પ્રશ્નોની ટૂંકી ટેસ્ટ - સમય: ૫ મિનિટ.', '5-question focused quiz • 5 minute countdown timer.')}
                  </p>
                </div>

                <button
                  onClick={handleStartTest}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all shrink-0"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{tr('સુધારાત્મક ટેસ્ટ શરૂ કરો (Start Remedial Test)', 'Start Remedial Test')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PHASE 3: TIMED REMEDIAL TEST                              */}
          {/* ========================================================= */}
          {phase === 'TEST' && (
            <div className="space-y-6">
              {/* Header Timer and Question Counter */}
              <div className="flex items-center justify-between bg-slate-800/90 border border-slate-700/80 rounded-2xl p-3.5">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
                  <Brain className="w-4 h-4 text-blue-400" />
                  <span>
                    {tr('પ્રશ્ન', 'Question')} {currentQuestionIndex + 1} / {questions.length}
                  </span>
                </div>

                {/* Visible Countdown Timer */}
                <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all ${
                  timeLeft <= 60
                    ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                    : timeLeft <= 120
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                }`}>
                  <Clock className="w-4 h-4" />
                  <span>{tr('બાકી સમય: ', 'Time: ')}{formatTimer(timeLeft)}</span>
                </div>
              </div>

              {/* Active Question */}
              {questions[currentQuestionIndex] && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/60 border border-slate-700/70 rounded-2xl space-y-2">
                    <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                      {trItem(questions[currentQuestionIndex].topicNameGu, questions[currentQuestionIndex].topicName)}
                    </span>
                    <h4 className="text-sm font-semibold text-white leading-relaxed">
                      {trItem(questions[currentQuestionIndex].questionTextGu, questions[currentQuestionIndex].questionText)}
                    </h4>
                  </div>

                  {/* Options */}
                  <div className="space-y-2.5">
                    {questions[currentQuestionIndex].options.map((opt) => {
                      const isSelected = selectedAnswers[questions[currentQuestionIndex].id] === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleSelectOption(questions[currentQuestionIndex].id, opt.id)}
                          className={`w-full p-3.5 rounded-2xl border text-left text-xs font-medium transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-600/20 border-blue-500 text-blue-200 ring-2 ring-blue-500/30'
                              : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <span>{trItem(opt.optionTextGu, opt.optionText)}</span>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-blue-500 bg-blue-600' : 'border-slate-600'
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Navigation & Submit */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                >
                  {tr('પાછળ', 'Previous')}
                </button>

                {currentQuestionIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5"
                  >
                    <span>{tr('આગળ', 'Next')}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitTest}
                    disabled={submitting}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center space-x-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{submitting ? tr('સબમિટ થઈ રહ્યું છે...', 'Submitting...') : tr('ટેસ્ટ પૂર્ણ કરો', 'Submit Test')}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PHASE 4: IMPROVEMENT REPORT & ENCOURAGEMENT               */}
          {/* ========================================================= */}
          {phase === 'REPORT' && remedialResult && (
            <div className="space-y-6">
              {/* Encouragement Banner */}
              <div className={`p-5 rounded-3xl border text-center space-y-2 ${
                remedialResult.percentage >= 50
                  ? 'bg-gradient-to-r from-emerald-950/50 via-teal-950/40 to-slate-900 border-emerald-500/40'
                  : 'bg-gradient-to-r from-amber-950/40 via-orange-950/30 to-slate-900 border-amber-500/40'
              }`}>
                <div className={`inline-flex p-3 rounded-2xl mb-1 ${
                  remedialResult.percentage >= 50 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {remedialResult.percentage >= 50 ? <Award className="w-8 h-8" /> : <Sparkles className="w-8 h-8" />}
                </div>
                <h3 className="text-lg font-bold text-white">
                  {remedialResult.percentage >= 50
                    ? tr('અભિનંદન! તમે પ્રગતિ કરી છે!', 'Great Job! You are improving!')
                    : tr('પ્રેક્ટિસ ચાલુ રાખો! તમે શીખી રહ્યા છો!', 'Keep practicing! You are improving!')}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed italic max-w-lg mx-auto">
                  "{trItem(remedialResult.encouragementMessageGu, remedialResult.encouragementMessage)}"
                </p>
              </div>

              {/* Side-by-Side Score & Improvement Comparison Card */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {tr('પહેલાંનો સ્કોર', 'Previous Score')}
                  </span>
                  <p className="text-xl font-extrabold text-slate-400 mt-1">
                    {remedialResult.initialPercentage}%
                  </p>
                </div>

                <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {tr('નવો સુધારેલ સ્કોર', 'Remedial Score')}
                  </span>
                  <p className="text-xl font-extrabold text-blue-400 mt-1">
                    {remedialResult.percentage}% ({remedialResult.score}/{remedialResult.maxScore})
                  </p>
                </div>

                <div className={`border rounded-2xl p-4 text-center ${
                  remedialResult.improvementPercentage > 0
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block">
                    {tr('સુધારો', 'Improvement')}
                  </span>
                  <p className="text-xl font-extrabold mt-1 flex items-center justify-center space-x-1">
                    <TrendingUp className="w-5 h-5" />
                    <span>
                      {remedialResult.improvementPercentage > 0 ? `+${remedialResult.improvementPercentage}%` : `${remedialResult.improvementPercentage}%`}
                    </span>
                  </p>
                </div>
              </div>

              {/* Topics Still Needing Practice (if any) */}
              {remedialResult.stillWeakTopics && remedialResult.stillWeakTopics.length > 0 ? (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2">
                  <span className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                    <AlertCircle className="w-4 h-4" />
                    <span>{tr('વધુ પ્રેક્ટિસ માટેના વિષયો:', 'Topics That Still Need Practice:')}</span>
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {remedialResult.stillWeakTopics.map((topic, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-slate-800 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold">
                        {trItem(topic.nameGu, topic.name)}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center space-x-2 text-xs font-bold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{tr('અદ્ભુત! આ પ્રકરણના તમામ વિષયોમાં સંપૂર્ણ સફળતા મેળવી છે! 🎉', 'All chapter topics mastered successfully! 🎉')}</span>
                </div>
              )}

              {/* Detailed Answers Review */}
              {remedialResult.detailedAnswers && remedialResult.detailedAnswers.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {tr('પ્રશ્નોત્તરી સમીક્ષા અને સમજૂતી:', 'Answer Review & Explanations:')}
                  </h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {remedialResult.detailedAnswers.map((da, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                          da.isCorrect ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-300">
                            {tr('પ્રશ્ન', 'Q')}{idx + 1}: {trItem(da.questionTextGu, da.questionText)}
                          </span>
                          <span className={`font-extrabold text-[10px] px-2 py-0.5 rounded-md ${
                            da.isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {da.isCorrect ? tr('સાચો', 'Correct') : tr('ખોટો', 'Needs Practice')}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                          <div>
                            <span className="text-slate-400">{tr('તમારો જવાબ: ', 'Your answer: ')}</span>
                            <span className={da.isCorrect ? 'font-bold text-emerald-400' : 'font-bold text-red-400'}>
                              {trItem(da.selectedOptionGu, da.selectedOption)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">{tr('સાચો જવાબ: ', 'Correct: ')}</span>
                            <span className="font-bold text-emerald-400">
                              {trItem(da.correctOptionGu, da.correctOption)}
                            </span>
                          </div>
                        </div>

                        {da.stepByStepSolution ? (
                          <StepByStepSolutionCard
                            solution={da.stepByStepSolution}
                            questionText={da.questionText}
                            explanationFallback={da.explanation}
                            explanationFallbackGu={da.explanationGu}
                          />
                        ) : (da.explanationGu || da.explanation) ? (
                          <p className="text-[11px] text-slate-300 border-t border-slate-700/60 pt-1.5 italic">
                            <strong className="text-blue-400">{tr('સમજૂતી: ', 'Note: ')}</strong>
                            {trItem(da.explanationGu, da.explanation)}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Close / Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                {remedialResult.percentage < 50 && (
                  <button
                    onClick={handleStartRevision}
                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{tr('ફરીથી પુનરાવર્તન કરો (Revise Again)', 'Revise Again')}</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all"
                >
                  {tr('પૂર્ણ કરો (Done)', 'Done')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
