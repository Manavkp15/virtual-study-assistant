import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { StepByStepSolution } from '../types';
import { StepByStepSolutionCard } from '../components/StepByStepSolutionCard';
import { tr, trSubject } from '../utils/tr';
import {
  Sparkles,
  Calculator,
  Search,
  BookOpen,
  Atom,
  FlaskConical,
  Compass,
  ArrowRight,
  RefreshCw,
  Lightbulb,
  CheckCircle2,
  HelpCircle,
  Mic,
  MicOff,
  Copy,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface QuickProblem {
  id: string;
  subject: 'Mathematics' | 'Science';
  category: string;
  categoryGu: string;
  categoryHi: string;
  problem: string;
  problemGu: string;
  problemHi: string;
  tag: string;
}

const CURRICULUM_LIBRARY: QuickProblem[] = [
  {
    id: 'qp-quad-1',
    subject: 'Mathematics',
    category: 'Algebra & Quadratic Equations',
    categoryGu: 'બીજગણિત અને દ્વિઘાત સમીકરણો',
    categoryHi: 'बीजगणित और द्विघात समीकरण',
    problem: 'Solve the quadratic equation: x² - 5x + 6 = 0',
    problemGu: 'દ્વિઘાત સમીકરણ ઉકેલો: x² - 5x + 6 = 0',
    problemHi: 'द्विघात समीकरण हल करें: x² - 5x + 6 = 0',
    tag: 'x² - 5x + 6 = 0'
  },
  {
    id: 'qp-quad-2',
    subject: 'Mathematics',
    category: 'Algebra & Quadratic Equations',
    categoryGu: 'બીજગણિત અને દ્વિઘાત સમીકરણો',
    categoryHi: 'बीजगणित और द्विघात समीकरण',
    problem: 'Find the discriminant and nature of roots for: 2x² - 4x + 3 = 0',
    problemGu: 'વિવેચક અને બીજનો પ્રકાર નક્કી કરો: 2x² - 4x + 3 = 0',
    problemHi: 'विविक्तकर और मूलों की प्रकृति ज्ञात करें: 2x² - 4x + 3 = 0',
    tag: '2x² - 4x + 3 = 0'
  },
  {
    id: 'qp-linear-1',
    subject: 'Mathematics',
    category: 'Linear Equations',
    categoryGu: 'રેખીય સમીકરણો',
    categoryHi: 'रैखिक समीकरण',
    problem: 'Solve for x: 3x - 15 = 30',
    problemGu: 'x ની કિંમત શોધો: 3x - 15 = 30',
    problemHi: 'x का मान ज्ञात करें: 3x - 15 = 30',
    tag: '3x - 15 = 30'
  },
  {
    id: 'qp-trig-1',
    subject: 'Mathematics',
    category: 'Trigonometry',
    categoryGu: 'ત્રિકોણમિતિ',
    categoryHi: 'त्रिकोणमिति',
    problem: 'Prove that: sin²θ + cos²θ = 1',
    problemGu: 'સાબિત કરો કે: sin²θ + cos²θ = 1',
    problemHi: 'सिद्ध करें: sin²θ + cos²θ = 1',
    tag: 'sin²θ + cos²θ = 1'
  },
  {
    id: 'qp-trig-2',
    subject: 'Mathematics',
    category: 'Trigonometry',
    categoryGu: 'ત્રિકોણમિતિ',
    categoryHi: 'त्रिकोणमिति',
    problem: 'Evaluate: tan(45°)',
    problemGu: 'મૂલ્ય શોધો: tan(45°)',
    problemHi: 'मान ज्ञात करें: tan(45°)',
    tag: 'tan(45°)'
  },
  {
    id: 'qp-calc-1',
    subject: 'Mathematics',
    category: 'Calculus',
    categoryGu: 'કલનશાસ્ત્ર',
    categoryHi: 'कलन',
    problem: 'Find the derivative of f(x) = 3x⁴ - 5x² + 7 with respect to x',
    problemGu: 'f(x) = 3x⁴ - 5x² + 7 નું x સાપેક્ષે વિકલન કરો',
    problemHi: 'f(x) = 3x⁴ - 5x² + 7 का x के सापेक्ष अवकलन ज्ञात करें',
    tag: 'd/dx (3x⁴ - 5x² + 7)'
  },
  {
    id: 'qp-sci-1',
    subject: 'Science',
    category: 'Physics - Newton\'s Laws',
    categoryGu: 'ભૌતિક વિજ્ઞાન - ન્યૂટનના નિયમો',
    categoryHi: 'भौतिक विज्ञान - न्यूटन के नियम',
    problem: 'A body of mass 10 kg is acted upon by a net force of 50 N. What is its acceleration?',
    problemGu: '10 kg ના દળવાળા પદાર્થ પર 50 N નું બળ લાગે છે. તેનો પ્રવેગ કેટલો થશે?',
    problemHi: '10 kg द्रव्यमान वाले पिंड पर 50 N का बल लगता है। उसका त्वरण क्या होगा?',
    tag: 'F = 50 N, m = 10 kg'
  },
  {
    id: 'qp-sci-2',
    subject: 'Science',
    category: 'Physics - Motion',
    categoryGu: 'ભૌતિક વિજ્ઞાન - ગતિ',
    categoryHi: 'भौतिक विज्ञान - गति',
    problem: 'A cyclist travels 1500 meters in 120 seconds. What is the speed in m/s?',
    problemGu: 'સાયકલ સવાર 120 સેકન્ડમાં 1500 મીટર અંતર કાપે છે. ઝડપ m/s માં શોધો.',
    problemHi: 'एक साइकिल चालक 120 सेकंड में 1500 मीटर की दूरी तय करता है। चाल m/s में ज्ञात करें।',
    tag: 'Distance = 1500m, Time = 120s'
  },
  {
    id: 'qp-sci-3',
    subject: 'Science',
    category: 'Chemistry - Chemical Reactions',
    categoryGu: 'રસાયણ વિજ્ઞાન - રાસાયણિક પ્રક્રિયાઓ',
    categoryHi: 'रसायन विज्ञान - रासायनिक अभिक्रियाएं',
    problem: 'In the chemical reaction 2H₂ + O₂ ⟶ 2H₂O, what are H₂ and O₂ called?',
    problemGu: 'રાસાયણિક પ્રક્રિયા 2H₂ + O₂ ⟶ 2H₂O માં H₂ અને O₂ ને શું કહેવાય?',
    problemHi: 'रासायनिक अभिक्रिया 2H₂ + O₂ ⟶ 2H₂O में H₂ और O₂ क्या कहलाते हैं?',
    tag: '2H₂ + O₂ ⟶ 2H₂O'
  },
  {
    id: 'qp-sci-4',
    subject: 'Science',
    category: 'Chemistry - Thermodynamics',
    categoryGu: 'રસાયણ વિજ્ઞાન - ઉષ્મા રસાયણ',
    categoryHi: 'रसायन विज्ञान - ऊष्मागतिकी',
    problem: 'What type of reaction absorbs thermal energy from its surroundings?',
    problemGu: 'કયા પ્રકારની રાસાયણિક પ્રક્રિયા આસપાસમાંથી ઉષ્મા ઊર્જાનું શોષણ કરે છે?',
    problemHi: 'किस प्रकार की रासायनिक अभिक्रिया परिवेश से ऊष्मा अवशोषित करती है?',
    tag: 'Endothermic vs Exothermic'
  }
];

const FORMULA_CHEAT_SHEET = [
  {
    subject: 'Mathematics',
    topic: 'Quadratic Equations',
    topicGu: 'દ્વિઘાત સમીકરણો',
    topicHi: 'द्विघात समीकरण',
    formulas: [
      { name: 'Standard Form', eq: 'ax² + bx + c = 0' },
      { name: 'Discriminant', eq: 'D = b² - 4ac' },
      { name: 'Quadratic Formula', eq: 'x = (-b ± √D) / (2a)' },
      { name: 'Nature of Roots', eq: 'D > 0: 2 Real Distinct; D = 0: 2 Real Equal; D < 0: Complex' }
    ]
  },
  {
    subject: 'Mathematics',
    topic: 'Trigonometry',
    topicGu: 'ત્રિકોણમિતિ',
    topicHi: 'त्रिकोणमिति',
    formulas: [
      { name: 'Pythagorean 1', eq: 'sin²θ + cos²θ = 1' },
      { name: 'Pythagorean 2', eq: 'sec²θ - tan²θ = 1' },
      { name: 'Pythagorean 3', eq: 'cosec²θ - cot²θ = 1' },
      { name: 'Ratio Identity', eq: 'tanθ = sinθ / cosθ' }
    ]
  },
  {
    subject: 'Science',
    topic: 'Force & Motion',
    topicGu: 'બળ અને ગતિ',
    topicHi: 'बल और गति',
    formulas: [
      { name: 'Newton\'s 2nd Law', eq: 'F = m · a ⟹ a = F / m' },
      { name: 'Momentum', eq: 'p = m · v' },
      { name: 'Speed', eq: 'Speed = Distance / Time' },
      { name: 'Kinetic Energy', eq: 'KE = ½ m · v²' }
    ]
  },
  {
    subject: 'Science',
    topic: 'Chemistry Reactions',
    topicGu: 'રાસાયણિક પ્રક્રિયાઓ',
    topicHi: 'रासायनिक अभिक्रियाएं',
    formulas: [
      { name: 'Endothermic Reaction', eq: 'Reactants + Heat Energy ⟶ Products (ΔH > 0)' },
      { name: 'Exothermic Reaction', eq: 'Reactants ⟶ Products + Heat Energy (ΔH < 0)' },
      { name: 'Photosynthesis', eq: '6CO₂ + 6H₂O + Sunlight ⟶ C₆H₁₂O₆ + 6O₂' }
    ]
  }
];

export const StepByStepSolverPage: React.FC = () => {
  const { i18n } = useTranslation();
  const isGu = i18n.language === 'gu';
  const isHi = i18n.language === 'hi';

  const [inputProblem, setInputProblem] = useState<string>('Solve the quadratic equation: x² - 5x + 6 = 0');
  const [selectedSubject, setSelectedSubject] = useState<'ALL' | 'Mathematics' | 'Science'>('ALL');
  const [activeSolution, setActiveSolution] = useState<StepByStepSolution | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [showFormulaSheet, setShowFormulaSheet] = useState<boolean>(false);

  // Initial solve on page load
  useEffect(() => {
    handleSolve('Solve the quadratic equation: x² - 5x + 6 = 0');
  }, [i18n.language]);

  const handleSolve = async (problemText?: string) => {
    const p = (problemText || inputProblem).trim();
    if (!p) return;

    if (problemText) {
      setInputProblem(problemText);
    }

    setLoading(true);
    try {
      const res = await api.post('/ai/solve-step-by-step', {
        problem: p,
        subject: selectedSubject !== 'ALL' ? selectedSubject : undefined,
        language: i18n.language || 'en'
      });

      if (res.data.success && res.data.solution) {
        setActiveSolution(res.data.solution);
      }
    } catch (err) {
      console.error('Failed to solve step-by-step:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(tr(
        'તમારા બ્રાઉઝરમાં અવાજ ઓળખ ઉપલબ્ધ નથી.',
        'Speech recognition is not supported in this browser.',
        'आपके ब्राउज़र में वॉइस इनपुट समर्थित नहीं है।'
      ));
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = isGu ? 'gu-IN' : (isHi ? 'hi-IN' : 'en-US');
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputProblem(transcript);
        handleSolve(transcript);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const filteredProblems = CURRICULUM_LIBRARY.filter(qp => {
    if (selectedSubject === 'ALL') return true;
    return qp.subject === selectedSubject;
  });

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-slate-900 border border-blue-500/20 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>{tr('પગલાંવાર ગાણિતિક & વૈજ્ઞાનિક સોલ્વર', 'Pedagogical STEM Problem Solver', 'क्रमबद्ध गणित और विज्ञान सॉल्वर')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {tr(
                'પગલાંવાર ઉકેલ અને સિદ્ધાંત માર્ગદર્શક',
                'Step-by-Step STEM Problem Solver',
                'स्टेप-बाय-स्टेप समस्या समाधान केंद्र'
              )}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              {tr(
                'ગણિત અને વિજ્ઞાનના કોઈપણ પ્રશ્નનો માત્ર અંતિમ જવાબ નહીં, પરંતુ દરેક પગલાંનું કારણ, સૂત્ર, ગણતરી અને સ્વતંત્ર ઉકેલ પદ્ધતિ શીખો.',
                'Master Mathematics and Science with sequential step-by-step reasoning, formulas, intermediate calculations, verified answers, and independent mastery tips.',
                'प्रत्येक गणितीय एवं वैज्ञानिक प्रश्न का पूर्ण तार्किक विश्लेषण, प्रयुक्त सूत्र, मध्यवर्ती गणनाएं और स्वतंत्र अभ्यास सीखें।'
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowFormulaSheet(prev => !prev)}
            className="self-start md:self-center px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-xs font-semibold text-blue-300 rounded-xl transition-colors flex items-center space-x-2 shrink-0 shadow-sm"
          >
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span>{showFormulaSheet ? tr('સૂત્ર માર્ગદર્શિકા છુપાવો', 'Hide Formula Sheet', 'सूत्र गाइड छिपाएं') : tr('મહત્વપૂર્ણ સૂત્રો (Cheat Sheet)', 'Formula Reference', 'महत्वपूर्ण सूत्र')}</span>
            {showFormulaSheet ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Formula Cheat Sheet (Collapsible) */}
      {showFormulaSheet && (
        <div className="bg-slate-900/95 border border-blue-500/30 rounded-2xl p-6 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2 text-sm font-bold text-blue-300">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span>{tr('મહત્વપૂર્ણ સૂત્રો અને સિદ્ધાંતો (Quick Formula Reference)', 'Essential Formulas & Governing Laws', 'आवश्यक सूत्र और सिद्धांत')}</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {tr('પરીક્ષા પુનરાવર્તન માટે', 'Exam Revision Aid', 'परीक्षा पुनरावलोकन')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FORMULA_CHEAT_SHEET.map((cat, i) => (
              <div key={i} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                    {isGu ? cat.topicGu : (isHi ? cat.topicHi : cat.topic)}
                  </h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {cat.subject}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {cat.formulas.map((f, fi) => (
                    <div key={fi} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1 bg-slate-900/80 p-2 rounded border border-slate-800/60">
                      <span className="text-slate-400 font-medium">{f.name}:</span>
                      <code className="font-mono text-emerald-300 font-semibold">{f.eq}</code>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Interactive Solver Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
        {/* Subject Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setSelectedSubject('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedSubject === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tr('બધા વિષયો', 'All Subjects', 'सभी विषय')}
            </button>
            <button
              type="button"
              onClick={() => setSelectedSubject('Mathematics')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                selectedSubject === 'Mathematics'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{tr('ગણિત', 'Mathematics', 'गणित')}</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedSubject('Science')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                selectedSubject === 'Science'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Atom className="w-3.5 h-3.5" />
              <span>{tr('વિજ્ઞાન', 'Science', 'विज्ञान')}</span>
            </button>
          </div>

          <div className="text-xs text-slate-400">
            {tr('લખો અથવા નીચેથી પસંદ કરો', 'Type equation or pick from curriculum', 'लिखें या नीचे से चुनें')}
          </div>
        </div>

        {/* Problem Input Box */}
        <div className="space-y-3">
          <div className="relative">
            <textarea
              rows={3}
              value={inputProblem}
              onChange={e => setInputProblem(e.target.value)}
              placeholder={tr(
                'દા.ત., x² - 5x + 6 = 0 ઉકેલો, અથવા F = 50 N અને m = 10 kg માટે પ્રવેગ શોધો...',
                'e.g., Solve x² - 5x + 6 = 0, or calculate acceleration for F = 50 N, m = 10 kg...',
                'उदा., x² - 5x + 6 = 0 हल करें, या 10 kg पिंड पर 50 N बल हेतु त्वरण ज्ञात करें...'
              )}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl p-4 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 leading-relaxed font-sans pr-24"
            />

            <div className="absolute right-3 bottom-3 flex items-center space-x-2">
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`p-2 rounded-xl border transition-all ${
                  isListening
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500 animate-pulse'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700'
                }`}
                title={tr('અવાજ દ્વારા ઇનપુટ કરો', 'Voice Input', 'बोलकर इनपुट करें')}
              >
                {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => handleSolve()}
                disabled={loading || !inputProblem.trim()}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 shadow-md shadow-blue-900/30"
              >
                {loading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Calculator className="w-3.5 h-3.5" />
                )}
                <span>{tr('ઉકેલો (Solve)', 'Solve Step-by-Step', 'हल करें')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Problem Chips */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>{tr('અભ્યાસક્રમના નમૂનારૂપ પ્રશ્નો (Curriculum Quick Picks):', 'Sample Curriculum Problems:', 'पाठ्यक्रम के मुख्य प्रश्न:')}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {filteredProblems.map(qp => {
              const problemText = isGu ? qp.problemGu : (isHi ? qp.problemHi : qp.problem);
              const isSelected = inputProblem === problemText;
              return (
                <button
                  key={qp.id}
                  type="button"
                  onClick={() => handleSolve(problemText)}
                  className={`text-xs px-3 py-1.5 rounded-xl border transition-all flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-semibold shadow-sm'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                  }`}
                >
                  <span className="font-mono text-[11px] text-blue-400">{qp.tag}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Rendered Live StepByStepSolutionCard */}
        <div className="pt-2">
          {loading ? (
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-10 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-slate-400">
                {tr(
                  'ગાણિતિક સૂત્રો, ગણતરી અને પગલાંઓનું વિશ્લેષણ થઈ રહ્યું છે...',
                  'Analyzing formulas, calculations, and pedagogical steps...',
                  'सूत्रों और गणना के चरणों का विश्लेषण हो रहा है...'
                )}
              </p>
            </div>
          ) : activeSolution ? (
            <StepByStepSolutionCard
              solution={activeSolution}
              defaultExpanded={true}
              questionText={inputProblem}
            />
          ) : (
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
              {tr(
                'પગલાંવાર ઉકેલ જોવા માટે ઉપર કોઈપણ પ્રશ્ન લખો અથવા નમૂના પસંદ કરો.',
                'Type any problem above or click a curriculum chip to view the complete step-by-step solution.',
                'क्रमबद्ध समाधान देखने के लिए ऊपर कोई प्रश्न लिखें या चुनें।'
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
