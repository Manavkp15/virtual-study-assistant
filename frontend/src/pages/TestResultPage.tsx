import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { TestResult } from '../types';
import { useTranslation } from 'react-i18next';
import { tr, trSubject, trItem } from '../utils/tr';
import { Trophy, CheckCircle2, XCircle, AlertCircle, ArrowRight, Brain, HeartHandshake, Sparkles, BookOpen, History, TrendingUp } from 'lucide-react';
import { RemedialSupportModal } from '../components/RemedialSupportModal';
import { RemedialHistoryModal } from '../components/RemedialHistoryModal';
import { StepByStepSolutionCard } from '../components/StepByStepSolutionCard';

export const TestResultPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['tests', 'common', 'mistakes', 'studyPlan']);
  const result: TestResult | undefined = location.state?.result;

  const [isRemedialOpen, setIsRemedialOpen] = useState<boolean>(result ? result.percentage < 50 : false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [remedialCompleted, setRemedialCompleted] = useState<any | null>(null);

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <p className="text-slate-400 text-sm">
          {tr('કોઈ ટેસ્ટ પરિણામ ડેટા મળ્યો નથી.', 'No test result data found.')}
        </p>
        <Link to="/tests" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold">
          {tr('ટેસ્ટ કૅટેલોગ પર પાછા જાઓ', 'Return to Tests Catalog')}
        </Link>
      </div>
    );
  }

  const minsTaken = Math.floor(result.timeTakenSeconds / 60);
  const secsTaken = result.timeTakenSeconds % 60;

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/30 rounded-3xl p-8 shadow-xl text-center space-y-3">
        <div className="inline-flex p-3 bg-blue-500/20 rounded-2xl text-blue-400 border border-blue-400/30">
          <Trophy className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-white">{t('result')}</h1>
        <p className="text-sm text-slate-300">
          {trItem(result.testTitleGu, result.testTitle)} ({trSubject({ name: result.subjectName, nameGu: result.subjectNameGu })})
        </p>
      </div>

      {/* Main Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
          <span className="text-xs font-semibold text-slate-400 uppercase">{t('score')}</span>
          <p className="text-2xl font-extrabold text-blue-400 mt-2">{result.score} / {result.maxScore}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
          <span className="text-xs font-semibold text-slate-400 uppercase">{t('percentage')}</span>
          <p className="text-2xl font-extrabold text-indigo-400 mt-2">{result.percentage}%</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
          <span className="text-xs font-semibold text-slate-400 uppercase">{t('accuracy')}</span>
          <p className="text-2xl font-extrabold text-emerald-400 mt-2">{result.accuracy}%</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
          <span className="text-xs font-semibold text-slate-400 uppercase">{t('timeTaken')}</span>
          <p className="text-2xl font-extrabold text-amber-400 mt-2">
            {minsTaken}{tr(' મિનિટ ', 'm ')}{secsTaken}{tr(' સેકન્ડ', 's')}
          </p>
        </div>
      </div>

      {/* Breakdown Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-300">{t('correctAnswer')}</span>
          </div>
          <span className="text-base font-extrabold text-emerald-400">{result.correctCount}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <XCircle className="w-5 h-5 text-red-400" />
            <span className="text-xs font-semibold text-slate-300">{t('wrongAnswer')}</span>
          </div>
          <span className="text-base font-extrabold text-red-400">{result.wrongCount}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-slate-500" />
            <span className="text-xs font-semibold text-slate-300">{t('unanswered')}</span>
          </div>
          <span className="text-base font-extrabold text-slate-400">{result.unansweredCount}</span>
        </div>
      </div>

      {/* AI Remedial Support Highlight Banner (Activated when score < 50% or remedial requested) */}
      {(result.percentage < 50 || result.requiresRemedial || remedialCompleted) && (
        <div className="bg-gradient-to-r from-amber-950/50 via-orange-950/40 to-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="p-3 bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 rounded-2xl shrink-0 mt-0.5">
                <HeartHandshake className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-base text-white">
                    {tr('AI સુધારાત્મક સહાય પ્રણાલી (AI Remedial Support)', 'AI Remedial Support System')}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {tr('સહાયક પુનરાવર્તન', 'Supportive Revision')}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                  {remedialCompleted ? (
                    <span>
                      🎉 {tr('તમે સુધારાત્મક સત્ર પૂર્ણ કર્યું છે! સ્કોરમાં સુધારો: ', 'You completed remedial revision! Score improvement: ')}
                      <strong className="text-emerald-400">+{remedialCompleted.improvementPercentage}%</strong>
                    </span>
                  ) : (
                    tr(
                      'ચાલો આ વિષયને સુધારીએ! તમને આ પ્રકરણમાં થોડી વધુ પ્રેક્ટિસની જરૂર પડી શકે છે. અમે તમારા માટે ખાસ પુનરાવર્તન સામગ્રી અને ૫ મિનિટની ટૂંકી પ્રેક્ટિસ ટેસ્ટ તૈયાર કરી છે.',
                      "Let's improve this topic! You may need a little more practice with this chapter. We've prepared targeted concept notes and a quick 5-minute remedial test."
                    )
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
              <button
                onClick={() => setIsRemedialOpen(true)}
                className="px-5 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/30 flex items-center space-x-2 transition-all"
              >
                <BookOpen className="w-4 h-4" />
                <span>
                  {remedialCompleted
                    ? tr('ફરીથી પુનરાવર્તન / ટેસ્ટ આપો', 'Review Again / Retake')
                    : tr('પ્રકરણ પુનરાવર્તન અને ટેસ્ટ', 'Revise Chapter & Practice')}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsHistoryOpen(true)}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl transition-colors"
                title={tr('સુધારાત્મક ઇતિહાસ જુઓ', 'View Remedial History')}
              >
                <History className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* What Should You Study Next Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="font-bold text-lg text-white flex items-center space-x-2">
          <Brain className="w-5 h-5 text-blue-400" />
          <span>{tr('આગળ તમારે શું અભ્યાસ કરવો જોઈએ?', 'What Should You Study Next?')}</span>
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/60 border border-slate-700/60 p-4 rounded-2xl italic">
          "{trItem(result.whatToStudyNextGu, result.whatToStudyNext)}"
        </p>

        <div className="flex items-center space-x-4 pt-2">
          <button
            onClick={() => navigate('/study-plan')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center space-x-2 transition-all"
          >
            <span>{tr("આજની અભ્યાસ યોજના અપડેટ કરો", "Update Today's Study Plan")}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/mistake-book')}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl transition-all"
          >
            {tr('ભૂલ પુસ્તિકાની સમીક્ષા કરો', 'Review Mistake Book')}
          </button>
        </div>
      </div>

      {/* Detailed Question Explanations */}
      {result.detailedAnswers && result.detailedAnswers.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <h3 className="font-bold text-lg text-white">{t('reviewAnswers')}</h3>
          <div className="space-y-4">
            {result.detailedAnswers.map((da, idx) => (
              <div
                key={da.questionId}
                className={`p-5 rounded-2xl border ${
                  da.isCorrect
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-red-500/5 border-red-500/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400">
                    {t('question')} {idx + 1} ({trItem(da.topicNameGu, da.topicName)})
                  </span>
                  <span className={`text-xs font-extrabold px-2.5 py-1 rounded-lg ${
                    da.isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {da.isCorrect ? t('correctAnswer') : t('wrongAnswer')}
                  </span>
                </div>
                <h4 className="font-semibold text-sm text-white">
                  {trItem(da.questionTextGu, da.questionText)}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs mt-3">
                  <div>
                    <span className="text-slate-400">{tr('તમારો જવાબ: ', 'Your Answer: ')}</span>
                    <span className={`font-bold ${da.isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                      {trItem(da.selectedOptionGu, da.selectedOption)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">{t('correctAnswer')}: </span>
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
                  <p className="text-xs text-slate-300 mt-3 pt-3 border-t border-slate-800/80 leading-relaxed">
                    <strong className="text-blue-400">{t('explanation')}: </strong>
                    {trItem(da.explanationGu, da.explanation)}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Remedial Support Interactive Modal */}
      <RemedialSupportModal
        isOpen={isRemedialOpen}
        onClose={() => setIsRemedialOpen(false)}
        attemptId={result.attemptId}
        onRemedialComplete={(res) => {
          setRemedialCompleted(res);
        }}
      />

      {/* Remedial History Modal */}
      <RemedialHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
};
