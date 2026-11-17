import React, { useState } from 'react';
import { StepByStepSolution } from '../types';
import { useTranslation } from 'react-i18next';
import { tr, trItem, trSubject } from '../utils/tr';
import {
  ChevronDown,
  ChevronUp,
  Lightbulb,
  CheckCircle2,
  Sparkles,
  Award,
  Volume2,
  VolumeX,
  BookOpen,
  ArrowRight,
  Hash,
  Calculator,
  AlertTriangle,
  Zap,
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

interface StepByStepSolutionCardProps {
  solution?: StepByStepSolution | null;
  defaultExpanded?: boolean;
  questionText?: string;
  explanationFallback?: string;
  explanationFallbackGu?: string;
}

export const StepByStepSolutionCard: React.FC<StepByStepSolutionCardProps> = ({
  solution,
  defaultExpanded = true,
  questionText,
  explanationFallback,
  explanationFallbackGu
}) => {
  const { i18n } = useTranslation();
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [showPracticeHint, setShowPracticeHint] = useState<boolean>(false);
  const [showPracticeAnswer, setShowPracticeAnswer] = useState<boolean>(false);
  const tts = useTextToSpeech();
  const isGu = i18n.language === 'gu';
  const isHi = i18n.language === 'hi';

  if (!solution) {
    if (!explanationFallback && !explanationFallbackGu) return null;
    return (
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 mt-3 space-y-2">
        <div className="flex items-center space-x-2 text-xs font-bold text-blue-400">
          <BookOpen className="w-4 h-4" />
          <span>{tr('વિગતવાર સમજૂતી', 'Detailed Explanation', 'विस्तृत व्याख्या')}</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {trItem(explanationFallbackGu, explanationFallback)}
        </p>
      </div>
    );
  }

  const subjectDisplay = isGu
    ? (solution.subjectGu || solution.subject)
    : (isHi ? (solution.subjectHi || solution.subject) : solution.subject);

  const topicDisplay = isGu
    ? (solution.topicGu || solution.topic)
    : (isHi ? (solution.topicHi || solution.topic) : solution.topic);

  const conceptDisplay = isGu
    ? (solution.conceptReasoningGu || solution.conceptReasoning)
    : (isHi ? (solution.conceptReasoningHi || solution.conceptReasoning) : solution.conceptReasoning);

  const finalAnswerDisplay = isGu
    ? (solution.finalAnswerGu || solution.finalAnswer)
    : (isHi ? (solution.finalAnswerHi || solution.finalAnswer) : solution.finalAnswer);

  const keyTakeawayDisplay = isGu
    ? (solution.keyTakeawayGu || solution.keyTakeaway)
    : (isHi ? (solution.keyTakeawayHi || solution.keyTakeaway) : solution.keyTakeaway);

  const verificationDisplay = isGu
    ? (solution.verificationGu || solution.verification)
    : (isHi ? (solution.verificationHi || solution.verification) : solution.verification);

  const commonMistakesDisplay = isGu
    ? (solution.commonMistakesGu || solution.commonMistakes)
    : (isHi ? (solution.commonMistakesHi || solution.commonMistakes) : solution.commonMistakes);

  const alternativeMethodDisplay = isGu
    ? (solution.alternativeMethodGu || solution.alternativeMethod)
    : (isHi ? (solution.alternativeMethodHi || solution.alternativeMethod) : solution.alternativeMethod);

  const practiceChallengeDisplay = isGu
    ? (solution.practiceChallengeGu || solution.practiceChallenge)
    : (isHi ? (solution.practiceChallengeHi || solution.practiceChallenge) : solution.practiceChallenge);

  // Generate speech summary for audio readout
  const handleToggleSpeech = () => {
    const cardId = `tts-solution-${solution.id || solution.topic || 'math-sci'}`;
    if (tts.playbackState === 'playing' && tts.activeMessageId === cardId) {
      tts.stop();
      return;
    }

    let speechScript = `${subjectDisplay}: ${topicDisplay}. `;
    if (conceptDisplay) {
      speechScript += `${isGu ? 'સિદ્ધાંત:' : (isHi ? 'अवधारणा:' : 'Concept:')} ${conceptDisplay}. `;
    }
    solution.steps.forEach(st => {
      const stepTitle = isGu ? (st.titleGu || st.title) : (isHi ? (st.titleHi || st.title) : st.title);
      const stepWhy = isGu ? (st.whyGu || st.why) : (isHi ? (st.whyHi || st.why) : st.why);
      speechScript += `${isGu ? 'પગલું' : (isHi ? 'चरण' : 'Step')} ${st.stepNumber}: ${stepTitle}. ${stepWhy}. `;
    });
    speechScript += `${isGu ? 'અંતિમ જવાબ:' : (isHi ? 'अंतिम उत्तर:' : 'Final Answer:')} ${finalAnswerDisplay}. `;
    if (keyTakeawayDisplay) {
      speechScript += `${keyTakeawayDisplay}`;
    }

    tts.speak(cardId, speechScript, i18n.language);
  };

  const isSpeaking = tts.playbackState === 'playing' && tts.activeMessageId === `tts-solution-${solution.id || solution.topic || 'math-sci'}`;

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-2 border-indigo-500/30 rounded-2xl p-5 shadow-lg space-y-4 my-3 transition-all">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
        <div className="flex items-center space-x-2.5 flex-wrap">
          <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/30">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-lg">
                {subjectDisplay}
              </span>
              <span className="text-[11px] font-bold text-slate-300">
                {topicDisplay}
              </span>
            </div>
            <h4 className="text-xs font-semibold text-slate-400 mt-0.5">
              {tr('પગલાવાર ઉકેલ અને વૈજ્ઞાનિક સમજૂતી', 'Step-by-Step Pedagogical Solution', 'चरणबद्ध हल एवं वैज्ञानिक व्याख्या')}
            </h4>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Read Aloud Button */}
          <button
            onClick={handleToggleSpeech}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 transition-all ${
              isSpeaking
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title={tr('ઉકેલ સાંભળો', 'Listen to solution', 'हल सुनें')}
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-blue-400" />}
            <span className="hidden sm:inline">
              {isSpeaking
                ? tr('અટકાવો', 'Stop Audio', 'रोकें')
                : tr('સાંભળો (TTS)', 'Listen', 'सुनें')}
            </span>
          </button>

          {/* Toggle Accordion */}
          <button
            onClick={() => setIsExpanded(prev => !prev)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl transition-colors"
            title={isExpanded ? tr('સંકોચો', 'Collapse', 'संक्षिप्त करें') : tr('વિસ્તૃત કરો', 'Expand', 'विस्तृत करें')}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4 pt-1">
          {/* 1. Concept & Strategic Reasoning Banner (Why this method is chosen) */}
          {conceptDisplay && (
            <div className="bg-gradient-to-r from-indigo-950/40 via-blue-950/30 to-slate-900 border border-indigo-500/30 rounded-xl p-3.5 flex items-start space-x-3">
              <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg shrink-0 mt-0.5">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-300 block">
                  {tr('શા માટે આ પદ્ધતિ? (Concept & Reasoning)', 'Concept & Strategic Reasoning', 'यह विधि क्यों? (अवधारणा और तर्क)')}
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {conceptDisplay}
                </p>
              </div>
            </div>
          )}

          {/* 2. Key Formulas Used Box */}
          {solution.formulas && solution.formulas.length > 0 && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center space-x-1.5">
                <Hash className="w-3.5 h-3.5" />
                <span>{tr('મહત્વપૂર્ણ સૂત્રો (Important Formulas)', 'Important Formulas Used', 'महत्वपूर्ण सूत्र')}</span>
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                {solution.formulas.map((formula, idx) => (
                  <span
                    key={idx}
                    className="font-mono text-xs font-semibold px-3 py-1 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-lg shadow-sm"
                  >
                    {formula}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 3. Given Values & What to Find (if available) */}
          {solution.givenValues && Object.keys(solution.givenValues).length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-800/40 border border-slate-800 p-3 rounded-xl">
              <div>
                <span className="text-slate-400 font-bold block mb-1">
                  {tr('આપેલ માહિતી (Given Parameters):', 'Given Parameters:', 'दी गई जानकारी:')}
                </span>
                <div className="space-y-0.5">
                  {Object.entries(solution.givenValues).map(([k, v]) => (
                    <div key={k} className="text-slate-300">
                      <strong className="text-slate-200">{k}:</strong> {v}
                    </div>
                  ))}
                </div>
              </div>

              {solution.toFind && (
                <div>
                  <span className="text-slate-400 font-bold block mb-1">
                    {tr('શોધવાનું છે (To Find):', 'To Find / Calculate:', 'ज्ञात करना है:')}
                  </span>
                  <div className="text-indigo-300 font-semibold">
                    {trItem(solution.toFindGu, solution.toFind)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. Sequential Step-by-Step Intermediate Steps */}
          {solution.steps && solution.steps.length > 0 && (
            <div className="space-y-3 pt-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                {tr('ક્રમબદ્ધ ગણતરી અને તાર્કિક પગલાં (Step-by-Step Calculations):', 'Ordered Sequential Calculations & Reasoning:', 'क्रमबद्ध गणना एवं तार्किक चरण:')}
              </span>

              <div className="space-y-2.5">
                {solution.steps.map((st) => {
                  const stepTitle = isGu
                    ? (st.titleGu || st.title)
                    : (isHi ? (st.titleHi || st.title) : st.title);

                  const stepWhy = isGu
                    ? (st.whyGu || st.why)
                    : (isHi ? (st.whyHi || st.why) : st.why);

                  const stepInter = isGu
                    ? (st.intermediateResultGu || st.intermediateResult)
                    : (isHi ? (st.intermediateResultHi || st.intermediateResult) : st.intermediateResult);

                  return (
                    <div
                      key={st.stepNumber}
                      className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3.5 space-y-2 hover:border-slate-600/80 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-300 border border-blue-500/40 text-[11px] font-extrabold flex items-center justify-center">
                            {st.stepNumber}
                          </span>
                          <span className="text-xs font-bold text-white">
                            {stepTitle}
                          </span>
                        </div>
                      </div>

                      {/* Why this step is performed */}
                      {stepWhy && (
                        <p className="text-xs text-slate-300 leading-relaxed pl-7">
                          <strong className="text-indigo-400 font-semibold">
                            {tr('શા માટે:', 'Why this step:', 'यह चरण क्यों:')}{' '}
                          </strong>
                          {stepWhy}
                        </p>
                      )}

                      {/* Mathematical or scientific calculation */}
                      {st.calculation && (
                        <div className="pl-7">
                          <pre className="font-mono text-xs text-emerald-300 bg-slate-950/70 border border-slate-800 p-2.5 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed">
                            {st.calculation}
                          </pre>
                        </div>
                      )}

                      {/* Intermediate outcome */}
                      {stepInter && (
                        <div className="pl-7 flex items-center space-x-2 text-[11px]">
                          <span className="text-slate-400 font-medium">
                            {tr('મધ્યવર્તી પરિણામ:', 'Intermediate outcome:', 'मध्यवर्ती परिणाम:')}
                          </span>
                          <span className="font-semibold text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                            {stepInter}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. Verification Check (if available) */}
          {verificationDisplay && (
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-emerald-400 block mb-0.5">
                  {tr('ચકાસણી (Verification):', 'Verification Check:', 'सत्यापन (Verification):')}
                </strong>
                <p className="text-emerald-200 leading-relaxed">{verificationDisplay}</p>
              </div>
            </div>
          )}

          {/* 6. Prominently Highlighted Final Answer */}
          {finalAnswerDisplay && (
            <div className="bg-gradient-to-r from-emerald-950/50 via-teal-950/40 to-slate-900 border-2 border-emerald-500/50 rounded-2xl p-4 shadow-lg shadow-emerald-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{tr('અંતિમ સ્પષ્ટ જવાબ (Final Answer)', 'Highlighted Final Answer', 'अंतिम स्पष्ट उत्तर')}</span>
                </span>
                <p className="text-xs text-slate-300">
                  {tr('ઉપરોક્ત પગલાંઓનું પરિણામ:', 'Conclusion of above steps:', 'उपरोक्त चरणों का परिणाम:')}
                </p>
              </div>

              <div className="bg-slate-900/90 border border-emerald-500/40 px-5 py-2.5 rounded-xl shadow-inner text-center sm:text-right">
                <span className="font-mono text-base sm:text-lg font-extrabold text-emerald-300 tracking-wide">
                  {finalAnswerDisplay}
                </span>
              </div>
            </div>
          )}

          {/* 7. Key Takeaway: Independent Problem Solving Tip */}
          {keyTakeawayDisplay && (
            <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3.5 flex items-start space-x-2.5">
              <Award className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-xs text-slate-300">
                <strong className="text-amber-300 font-bold block">
                  {tr('સ્વતંત્ર ઉકેલ માટે માર્ગદર્શન (Mastery Tip):', 'How to Solve Similar Problems Independently:', 'स्वतंत्र हल हेतु महत्वपूर्ण सुझाव:')}
                </strong>
                <p className="text-slate-300 leading-relaxed italic">
                  "{keyTakeawayDisplay}"
                </p>
              </div>
            </div>
          )}

          {/* 8. Common Mistakes & Misconceptions to Avoid */}
          {commonMistakesDisplay && commonMistakesDisplay.length > 0 && (
            <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-rose-400">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{tr('સામાન્ય ભૂલો અને સાવચેતી (Common Mistakes to Avoid)', 'Common Mistakes & Pitfalls to Avoid', 'सामान्य गलतियाँ और सावधानियाँ')}</span>
              </div>
              <ul className="space-y-1.5 pl-6 list-disc text-xs text-rose-200/90 leading-relaxed">
                {commonMistakesDisplay.map((mistake, idx) => (
                  <li key={idx} className="marker:text-rose-400">{mistake}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 9. Alternative Method / Shortcut */}
          {alternativeMethodDisplay && (
            <div className="bg-purple-950/20 border border-purple-500/30 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-purple-300">
                <Zap className="w-4 h-4 text-purple-400 shrink-0" />
                <span>{tr('વૈકલ્પિક પદ્ધતિ / શોર્ટકટ:', 'Alternative Method / Shortcut:', 'वैकल्पिक विधि / शॉर्टकट:')} {alternativeMethodDisplay.title}</span>
              </div>
              <p className="text-xs text-purple-200 leading-relaxed pl-6">
                {alternativeMethodDisplay.description}
              </p>
              {alternativeMethodDisplay.calculation && (
                <div className="pl-6">
                  <pre className="font-mono text-xs text-purple-200 bg-slate-950/80 border border-purple-500/20 p-2.5 rounded-lg whitespace-pre-wrap">
                    {alternativeMethodDisplay.calculation}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* 10. Interactive Practice Challenge (Try It Yourself) */}
          {practiceChallengeDisplay && (
            <div className="bg-indigo-950/25 border border-indigo-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-indigo-300">
                  <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>{tr('સ્વ-અભ્યાસ માટે સમાન પ્રશ્ન (Try It Yourself)', 'Try It Yourself Challenge (Solve Independently)', 'स्वयं हल करने हेतु समान प्रश्न')}</span>
                </div>
                <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {tr('પ્રેક્ટિસ ચેલેન્જ', 'Practice Mode', 'अभ्यास')}
                </span>
              </div>

              <div className="bg-slate-900/90 border border-indigo-500/20 p-3 rounded-lg text-xs font-medium text-slate-200">
                {practiceChallengeDisplay.problem}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {practiceChallengeDisplay.hint && (
                  <button
                    type="button"
                    onClick={() => setShowPracticeHint(prev => !prev)}
                    className="px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors flex items-center space-x-1.5"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    <span>{showPracticeHint ? tr('સંકેત છુપાવો', 'Hide Hint', 'संकेत छिपाएं') : tr('સંકેત જુઓ (Show Hint)', 'Show Hint', 'संकेत देखें')}</span>
                  </button>
                )}

                {practiceChallengeDisplay.answer && (
                  <button
                    type="button"
                    onClick={() => setShowPracticeAnswer(prev => !prev)}
                    className="px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors flex items-center space-x-1.5"
                  >
                    {showPracticeAnswer ? <EyeOff className="w-3.5 h-3.5 text-emerald-400" /> : <Eye className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>{showPracticeAnswer ? tr('જવાબ છુપાવો', 'Hide Answer', 'उत्तर छिपाएं') : tr('જવાબ ચકાસો (Reveal Answer)', 'Reveal Answer', 'उत्तर देखें')}</span>
                  </button>
                )}
              </div>

              {showPracticeHint && practiceChallengeDisplay.hint && (
                <div className="bg-amber-950/30 border border-amber-500/30 p-2.5 rounded-lg text-xs text-amber-200 flex items-start space-x-2">
                  <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed"><strong>{tr('સંકેત:', 'Hint:', 'संकेत:')}</strong> {practiceChallengeDisplay.hint}</p>
                </div>
              )}

              {showPracticeAnswer && practiceChallengeDisplay.answer && (
                <div className="bg-emerald-950/30 border border-emerald-500/30 p-2.5 rounded-lg text-xs text-emerald-200 flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-emerald-300 font-bold mb-0.5">{tr('સાચો જવાબ:', 'Verified Answer:', 'सत्यापित उत्तर:')}</strong>
                    <p className="font-mono text-emerald-100">{practiceChallengeDisplay.answer}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
