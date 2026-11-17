import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import {
  Bot,
  Send,
  Sparkles,
  Brain,
  User,
  Calculator,
  MessageSquare,
  ArrowRight,
  BookOpen,
  HelpCircle,
  RotateCcw,
  ShieldCheck
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { tr } from '../utils/tr';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { TTSControlBar } from '../components/TTSControlBar';
import { StepByStepSolutionCard } from '../components/StepByStepSolutionCard';
import { StepByStepSolution } from '../types';

interface ChatMessage {
  id: string;
  sender: 'USER' | 'AI';
  text: string;
  timestamp: string;
}

export const AIAssistantPage: React.FC = () => {
  const { t, i18n } = useTranslation('ai');
  const tts = useTextToSpeech();
  const isGu = i18n.language === 'gu';
  const isHi = i18n.language === 'hi';

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'CHAT' | 'SOLVER'>('SOLVER');

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatNcertMode, setChatNcertMode] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Problem Solver State
  const [solverProblem, setSolverProblem] = useState('');
  const [solverSubject, setSolverSubject] = useState<'ALL' | 'Mathematics' | 'Science'>('ALL');
  const [solverLoading, setSolverLoading] = useState(false);
  const [activeSolution, setActiveSolution] = useState<StepByStepSolution | null>(null);

  const presetQuestions = [
    t('prompt1'),
    t('prompt2'),
    isGu ? 'દ્વિઘાત સમીકરણ x² - 5x + 6 = 0 ના બીજ સ્ટેપ-બાય-સ્ટેપ ઉકેલો' : (isHi ? 'द्विघात समीकरण x² - 5x + 6 = 0 के मूल चरणबद्ध हल करें' : 'Solve x² - 5x + 6 = 0 step-by-step'),
    isGu ? '10 kg ના દળ પર 50 N બળ લાગતાં પ્રવેગ ગણો' : (isHi ? '10 kg द्रव्यमान पर 50 N बल से त्वरण ज्ञात करें' : 'Calculate acceleration for 10 kg mass with 50 N force')
  ];

  const quickCurriculumProblems = [
    {
      label: isGu ? 'દ્વિઘાત સમીકરણ બીજ: x² - 5x + 6 = 0' : (isHi ? 'द्विघात समीकरण मूल: x² - 5x + 6 = 0' : 'Quadratic Roots: x² - 5x + 6 = 0'),
      problem: 'What are the roots of the quadratic equation x² - 5x + 6 = 0?',
      subject: 'Mathematics'
    },
    {
      label: isGu ? 'વિવેચક ગણતરી: 2x² - 4x + 3 = 0' : (isHi ? 'विविक्तकर गणना: 2x² - 4x + 3 = 0' : 'Discriminant: 2x² - 4x + 3 = 0'),
      problem: 'What is the discriminant (D) of the equation 2x² - 4x + 3 = 0?',
      subject: 'Mathematics'
    },
    {
      label: isGu ? 'રેખીય સમીકરણ ઉકેલ: 3x + 15 = 45' : (isHi ? 'रैखिक समीकरण हल: 3x + 15 = 45' : 'Linear Equation: 3x + 15 = 45'),
      problem: 'Solve 3x + 15 = 45',
      subject: 'Mathematics'
    },
    {
      label: isGu ? 'ત્રિકોણમિતિ નિત્યસમ: sin²(θ) + cos²(θ)' : (isHi ? 'त्रिकोणमितीय सर्वसमिका: sin²(θ) + cos²(θ)' : 'Trig Identity: sin²(θ) + cos²(θ)'),
      problem: 'Which of the following is equivalent to sin²(θ) + cos²(θ)?',
      subject: 'Mathematics'
    },
    {
      label: isGu ? 'ન્યૂટનનો ૨જો ગતિ નિયમ સૂત્ર (F = m × a)' : (isHi ? 'न्यूटन का गति नियम सूत्र (F = m × a)' : "Newton's 2nd Law Formula (F = m × a)"),
      problem: 'According to Newton Second Law of Motion, what is the formula connecting Force (F), Mass (m), and Acceleration (a)?',
      subject: 'Science'
    },
    {
      label: isGu ? 'પ્રવેગ ગણતરી: m = 10 kg, F = 50 N' : (isHi ? 'त्वरण गणना: m = 10 kg, F = 50 N' : 'Acceleration: m = 10 kg, F = 50 N'),
      problem: 'A body of mass 10 kg is acted upon by a net force of 50 N. What is its acceleration?',
      subject: 'Science'
    },
    {
      label: isGu ? 'રાસાયણિક પ્રક્રિયકો: 2H₂ + O₂ ⟶ 2H₂O' : (isHi ? 'रासायनिक अभिकारक: 2H₂ + O₂ ⟶ 2H₂O' : 'Reactants in 2H₂ + O₂ ⟶ 2H₂O'),
      problem: 'In the chemical reaction 2H₂ + O₂ ⟶ 2H₂O, what are H₂ and O₂ called?',
      subject: 'Science'
    },
    {
      label: isGu ? 'ઉષ્માશોષક પ્રક્રિયા એટલે શું?' : (isHi ? 'ऊष्माशोषी अभिक्रिया क्या है?' : 'Endothermic Reactions Explained'),
      problem: 'What type of reaction absorbs thermal energy from its surroundings?',
      subject: 'Science'
    }
  ];

  useEffect(() => {
    // Initial welcome AI guidance message
    const initAI = async () => {
      try {
        const res = await api.get(`/ai/guidance?lang=${i18n.language}`);
        const guidance = res.data.guidance;
        setMessages([
          {
            id: 'msg-guidance-welcome',
            sender: 'AI',
            text: `👋 ${guidance.personalizedFeedback}\n\n💡 ${guidance.nextStepGuidance}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } catch (err) {
        setMessages([
          {
            id: 'msg-guidance-fallback',
            sender: 'AI',
            text: tr(
              'નમસ્તે! હું તમારો VM જ્ઞાનસેતુ AI મદદગાર છું. તમારા પ્રદર્શન અથવા અભ્યાસ યોજના વિશે કંઈ પણ પૂછો.',
              'Hello! I am your VM GyanSetu AI Assistant. Ask me anything about your performance, weak topics, or study schedule.',
              'नमस्ते! मैं आपका VM ज्ञानसेतु AI सहायक हूँ। अपने प्रदर्शन, कमजोर विषयों या अध्ययन कार्यक्रम के बारे में कुछ भी पूछें।'
            ),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    };
    initAI();

    // Default load first problem solution in solver
    handleSolveProblem('What are the roots of the quadratic equation x² - 5x + 6 = 0?');
  }, [i18n.language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      tts.stop();
    };
  }, []);

  const handleSend = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sender: 'USER',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInputQuery('');
    setLoading(true);

    try {
      let aiText = '';
      if (chatNcertMode) {
        const res = await api.post('/rag/ask', {
          question: q,
          language: i18n.language,
          ncertMode: true
        });
        aiText = res.data.answer;
      } else {
        const res = await api.post('/ai/chat', { question: q, language: i18n.language });
        aiText = res.data.answer;
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sender: 'AI',
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: `ai-err-${Date.now()}`,
        sender: 'AI',
        text: tr(
          'ક્ષમા કરશો, ક્ષતિ આવી છે. કૃપા કરીને ફરી પ્રયાસ કરો.',
          'Sorry, I ran into an issue retrieving your database telemetry. Please try again.',
          'क्षमा करें, एक त्रुटि हुई है। कृपया पुनः प्रयास करें।'
        ),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSolveProblem = async (problemToSolve?: string) => {
    const p = (problemToSolve || solverProblem).trim();
    if (!p) return;

    setSolverLoading(true);
    if (problemToSolve) {
      setSolverProblem(problemToSolve);
    }

    try {
      const res = await api.post('/ai/solve-step-by-step', {
        problem: p,
        subject: solverSubject !== 'ALL' ? solverSubject : undefined,
        language: i18n.language || 'en'
      });
      if (res.data.success && res.data.solution) {
        setActiveSolution(res.data.solution);
      }
    } catch (err) {
      console.error('Failed to solve step-by-step:', err);
    } finally {
      setSolverLoading(false);
    }
  };

  const filteredQuickProblems = quickCurriculumProblems.filter(qp => {
    if (solverSubject === 'ALL') return true;
    return qp.subject === solverSubject;
  });

  return (
    <div className="space-y-6 pb-12 min-h-[calc(100vh-6rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-3">
            <Calculator className="w-7 h-7 text-indigo-400" />
            <span>{tr('ગણિત અને વિજ્ઞાન પગલાવાર ઉકેલ કેન્દ્ર', 'STEM Step-by-Step Solution Center', 'गणित एवं विज्ञान चरणबद्ध हल केंद्र')}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {tr(
              'દરેક ગણિત અને વિજ્ઞાન સમસ્યા માટે સંપૂર્ણ સૂત્રો, તાર્કિક કારણો, ગણતરી અને હાઇલાઇટ કરેલ અંતિમ જવાબ.',
              'Detailed step-by-step solutions for Mathematics & Science problems with all formulas, reasoning, and highlighted final answers.',
              'प्रत्येक गणित एवं विज्ञान प्रश्न के लिए विस्तृत सूत्र, तार्किक चरण एवं स्पष्ट अंतिम उत्तर।'
            )}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-2xl">
          <button
            onClick={() => setActiveTab('SOLVER')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'SOLVER'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>{tr('પગલાવાર ઉકેલકર્તા', 'Step-by-Step Solver', 'चरणबद्ध हलकर्ता')}</span>
          </button>

          <button
            onClick={() => setActiveTab('CHAT')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'CHAT'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{tr('AI અભ્યાસ સહાયક ચેટ', 'AI Study Chat', 'एआई अध्ययन चैट')}</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: STEP-BY-STEP STEM PROBLEM SOLVER                 */}
      {/* ======================================================== */}
      {activeTab === 'SOLVER' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          {/* Left Column: Problem Input & Curated Curriculum Chips */}
          <div className="lg:col-span-5 space-y-5">
            {/* Input Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center space-x-2">
                  <Brain className="w-4 h-4 text-indigo-400" />
                  <span>{tr('સમસ્યા દાખલ કરો (Enter Problem):', 'Enter Problem Statement:', 'प्रश्न दर्ज करें:')}</span>
                </span>

                {/* Subject Filter Pills */}
                <div className="flex items-center space-x-1 text-[11px]">
                  <button
                    onClick={() => setSolverSubject('ALL')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      solverSubject === 'ALL'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {tr('બધા', 'All', 'सभी')}
                  </button>
                  <button
                    onClick={() => setSolverSubject('Mathematics')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      solverSubject === 'Mathematics'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {tr('ગણિત', 'Math', 'गणित')}
                  </button>
                  <button
                    onClick={() => setSolverSubject('Science')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                      solverSubject === 'Science'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {tr('વિજ્ઞાન', 'Science', 'विज्ञान')}
                  </button>
                </div>
              </div>

              {/* Textarea */}
              <textarea
                value={solverProblem}
                onChange={(e) => setSolverProblem(e.target.value)}
                placeholder={tr(
                  'ગણિત અથવા વિજ્ઞાનનો કોઈપણ પ્રશ્ન દાખલ કરો (દા.ત. 3x + 12 = 42, દ્વિઘાત સમીકરણ x² - 5x + 6 = 0 ના બીજ, 10 kg દળ અને 50 N બળ માટે પ્રવેગ...)',
                  'Enter any Mathematics or Science problem (e.g. 3x + 15 = 45, roots of x² - 5x + 6 = 0, calculate acceleration for 10 kg mass with 50 N force, Newton laws...)',
                  'गणित या विज्ञान का कोई भी प्रश्न दर्ज करें (उदा. 3x + 15 = 45, x² - 5x + 6 = 0 के मूल, 10 kg द्रव्यमान पर 50 N बल से त्वरण...)'
                )}
                rows={4}
                className="w-full p-4 bg-slate-800/90 border border-slate-700/80 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs leading-relaxed"
              />

              {/* Solve Button */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setSolverProblem('')}
                  className="px-3 py-2 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{tr('સાફ કરો', 'Clear', 'साफ करें')}</span>
                </button>

                <button
                  onClick={() => handleSolveProblem()}
                  disabled={solverLoading || !solverProblem.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{solverLoading ? tr('ઉકેલાઈ રહ્યું છે...', 'Solving...', 'हल हो रहा है...') : tr('પગલાવાર ઉકેલ મેળવો', 'Solve Step-by-Step', 'चरणबद्ध हल प्राप्त करें')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Curriculum Templates */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <span className="text-xs font-bold text-slate-300 flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span>{tr('અભ્યાસક્રમના મહત્વપૂર્ણ પ્રશ્નો (Curriculum Problems):', 'Important Curriculum Problems:', 'पाठ्यक्रम के महत्वपूर्ण प्रश्न:')}</span>
              </span>

              <div className="space-y-2">
                {filteredQuickProblems.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSolveProblem(item.problem)}
                    className="w-full p-2.5 text-left bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/50 rounded-xl text-xs text-slate-200 transition-all flex items-center justify-between group"
                  >
                    <span className="font-medium group-hover:text-white">{item.label}</span>
                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 shrink-0 ml-2">
                      {item.subject === 'Mathematics' ? tr('ગણિત', 'Math', 'गणित') : tr('વિજ્ઞાન', 'Science', 'विज्ञान')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Step-by-Step Solution Card */}
          <div className="lg:col-span-7 flex flex-col">
            {solverLoading ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 flex-1 flex flex-col items-center justify-center space-y-3">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-semibold text-slate-400">
                  {tr('સૂત્રો, ગણતરી અને તાર્કિક પગલાંઓનું વિશ્લેષણ થઈ રહ્યું છે...', 'Analyzing formulas, calculations, and intermediate steps...', 'सूत्रों, गणनाओं और तार्किक चरणों का विश्लेषण हो रहा है...')}
                </p>
              </div>
            ) : activeSolution ? (
              <div className="flex-1">
                <StepByStepSolutionCard
                  solution={activeSolution}
                  defaultExpanded={true}
                />
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 flex-1 flex flex-col items-center justify-center text-center space-y-3">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
                  <Calculator className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-white">
                  {tr('કોઈપણ પ્રશ્ન પસંદ કરો અથવા દાખલ કરો', 'Select or enter any Mathematics/Science problem', 'कोई भी प्रश्न चुनें या दर्ज करें')}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  {tr(
                    'અમારું એન્જિન તમામ પાયાના સૂત્રો, મધ્યવર્તી ગણતરીઓ અને કારણો સાથે સંપૂર્ણ પગલાવાર ઉકેલ રજૂ કરશે.',
                    'Our engine will provide complete intermediate steps, reasoning, formulas, and highlighted final answers.',
                    'हमारा इंजन सभी सूत्रों, मध्यवर्ती गणनाओं और तर्कों के साथ पूर्ण चरणबद्ध हल प्रदान करेगा।'
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: AI STUDY CHAT                                     */}
      {/* ======================================================== */}
      {activeTab === 'CHAT' && (
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between overflow-hidden">
          {/* NCERT Mode Banner inside Chat */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <ShieldCheck className={`w-4 h-4 ${chatNcertMode ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span className="text-xs font-bold text-white">
                {chatNcertMode
                  ? tr('NCERT મોડ સક્રિય: ૧૦૦% પાઠ્યપુસ્તક આધારિત ઉત્તર', 'NCERT Mode Active: 100% Textbook Grounded')
                  : tr('સામાન્ય AI ચેટ મોડ', 'Standard AI Chat Mode')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setChatNcertMode(!chatNcertMode)}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center space-x-1.5 ${
                chatNcertMode
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              <span>{chatNcertMode ? 'NCERT: ON' : 'NCERT: OFF'}</span>
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {messages.map((msg) => {
              const isAI = msg.sender === 'AI';
              const isReading = tts.activeMessageId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`flex items-start space-x-3 transition-all ${
                    msg.sender === 'USER' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <div className={`p-2.5 rounded-2xl flex-shrink-0 transition-all ${
                    msg.sender === 'USER'
                      ? 'bg-blue-600 text-white'
                      : isReading
                        ? 'bg-blue-600/30 text-blue-300 border border-blue-400/50 shadow-lg shadow-blue-500/20 ring-2 ring-blue-500/40'
                        : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  }`}>
                    {msg.sender === 'USER' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Brain className={`w-4 h-4 ${isReading ? 'animate-pulse text-blue-300' : ''}`} />
                    )}
                  </div>

                  <div className={`max-w-2xl p-4 rounded-2xl text-xs leading-relaxed space-y-2 transition-all duration-300 ${
                    msg.sender === 'USER'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : isReading
                        ? 'bg-slate-800/95 text-slate-100 border-2 border-blue-500 rounded-tl-none whitespace-pre-wrap ring-4 ring-blue-500/20 shadow-xl shadow-blue-500/10'
                        : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-none whitespace-pre-wrap'
                  }`}>
                    <div className="whitespace-pre-wrap font-sans">{msg.text}</div>

                    {isAI && (
                      <TTSControlBar
                        messageId={msg.id}
                        text={msg.text}
                        tts={tts}
                        langHint={i18n.language}
                      />
                    )}

                    <span className={`block text-[10px] ${msg.sender === 'USER' ? 'text-blue-200 text-right' : 'text-slate-500 pt-0.5'}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <Brain className="w-4 h-4 animate-spin" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 text-xs text-slate-400">
                  {t('thinking')}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Preset Questions Chips */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>{t('quickPrompts')}:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {presetQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium rounded-xl border border-slate-700 transition-all text-left"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Box */}
            <div className="relative pt-2">
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t('askPlaceholder')}
                className="w-full pl-4 pr-12 py-3 bg-slate-800/90 border border-slate-700/80 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !inputQuery.trim()}
                className="absolute right-2 top-4 p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
