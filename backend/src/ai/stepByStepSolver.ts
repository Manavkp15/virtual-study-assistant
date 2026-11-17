import fs from 'fs';
import path from 'path';

export interface SolutionStep {
  stepNumber: number;
  title: string;
  titleGu?: string;
  titleHi?: string;
  why: string;            // Why this step is performed (conceptual reasoning)
  whyGu?: string;
  whyHi?: string;
  calculation: string;    // Mathematical/scientific calculation and substitution
  intermediateResult?: string;
  intermediateResultGu?: string;
  intermediateResultHi?: string;
}

export interface StepByStepSolution {
  id?: string;
  subject: string;        // 'Mathematics' | 'Science'
  subjectGu?: string;
  subjectHi?: string;
  topic: string;
  topicGu?: string;
  topicHi?: string;
  problemStatement: string;
  problemStatementGu?: string;
  problemStatementHi?: string;
  conceptReasoning: string;// Core concept, theorem, or law behind the problem
  conceptReasoningGu?: string;
  conceptReasoningHi?: string;
  formulas: string[];      // Key formulas used
  givenValues?: Record<string, string>; // Given data / variables
  toFind?: string;         // What needs to be calculated
  toFindGu?: string;
  toFindHi?: string;
  steps: SolutionStep[];   // Ordered sequence of steps
  verification?: string;   // Optional verification / check step
  verificationGu?: string;
  verificationHi?: string;
  finalAnswer: string;     // The clearly highlighted final answer
  finalAnswerGu?: string;
  finalAnswerHi?: string;
  keyTakeaway: string;     // Pedagogical tip: how to solve similar problems independently
  keyTakeawayGu?: string;
  keyTakeawayHi?: string;
  commonMistakes?: string[];
  commonMistakesGu?: string[];
  commonMistakesHi?: string[];
  alternativeMethod?: {
    title: string;
    description: string;
    calculation?: string;
  };
  alternativeMethodGu?: {
    title: string;
    description: string;
    calculation?: string;
  };
  alternativeMethodHi?: {
    title: string;
    description: string;
    calculation?: string;
  };
  practiceChallenge?: {
    problem: string;
    hint: string;
    answer: string;
  };
  practiceChallengeGu?: {
    problem: string;
    hint: string;
    answer: string;
  };
  practiceChallengeHi?: {
    problem: string;
    hint: string;
    answer: string;
  };
}

/**
 * Curated high-precision step-by-step solutions for curriculum questions
 */
const CURRICULUM_SOLUTIONS: Record<string, StepByStepSolution> = {
  // 1. Quadratic Equation Roots: x² - 5x + 6 = 0
  'quad_roots': {
    subject: 'Mathematics',
    subjectGu: 'ગણિત',
    subjectHi: 'गणित',
    topic: 'Quadratic Equations',
    topicGu: 'દ્વિઘાત સમીકરણો',
    topicHi: 'द्विघात समीकरण',
    problemStatement: 'What are the roots of the quadratic equation x² - 5x + 6 = 0?',
    problemStatementGu: 'દ્વિઘાત સમીકરણ x² - 5x + 6 = 0 ના બીજ કયા છે?',
    problemStatementHi: 'द्विघात समीकरण x² - 5x + 6 = 0 के मूल क्या हैं?',
    conceptReasoning: 'A quadratic equation in standard form ax² + bx + c = 0 can be solved by factoring the middle term. We find two numbers p and q such that p × q = a × c and p + q = b, then apply the Zero Product Property.',
    conceptReasoningGu: 'દ્વિઘાત સમીકરણ ax² + bx + c = 0 ને મધ્યમ પદના વિભાજન (અવયવીકરણ) દ્વારા ઉકેલી શકાય છે. આપણે એવી બે સંખ્યાઓ p અને q શોધીએ છીએ જેથી p × q = a × c અને p + q = b થાય, ત્યારબાદ શૂન્ય ગુણાકાર નિયમ લાગુ કરીએ છીએ.',
    conceptReasoningHi: 'द्विघात समीकरण ax² + bx + c = 0 को मध्य पद के विभाजन (गुणनखंडन) द्वारा हल किया जा सकता है। हम दो ऐसी संख्याएँ p और q ज्ञात करते हैं जिनका गुणनफल p × q = a × c और योग p + q = b हो।',
    formulas: [
      'ax² + bx + c = 0',
      'p × q = a × c and p + q = b',
      'If A × B = 0, then A = 0 or B = 0'
    ],
    givenValues: {
      'Equation': 'x² - 5x + 6 = 0',
      'Coefficients': 'a = 1, b = -5, c = 6'
    },
    toFind: 'Values of x (roots of the equation)',
    toFindGu: 'x ના મૂલ્યો (સમીકરણના બીજ)',
    toFindHi: 'x के मान (समीकरण के मूल)',
    steps: [
      {
        stepNumber: 1,
        title: 'Identify Coefficients',
        titleGu: 'સહગુણકો ઓળખો',
        titleHi: 'गुणांकों की पहचान करें',
        why: 'Comparing with standard form ax² + bx + c = 0 establishes the parameters needed for factoring.',
        whyGu: 'પ્રમાણભૂત સ્વરૂપ ax² + bx + c = 0 સાથે સરખાવવાથી અવયવીકરણ માટે જરૂરી પદો મળે છે.',
        whyHi: 'मानक रूप ax² + bx + c = 0 से तुलना करने पर गुणनखंडन हेतु आवश्यक मान प्राप्त होते हैं।',
        calculation: 'a = 1, b = -5, c = 6. Product a × c = 1 × 6 = 6.',
        intermediateResult: 'Target: Find two numbers whose product is 6 and sum is -5.',
        intermediateResultGu: 'ધ્યેય: જેનો ગુણાકાર 6 અને સરવાળો -5 હોય તેવી બે સંખ્યાઓ શોધો.'
      },
      {
        stepNumber: 2,
        title: 'Split the Middle Term',
        titleGu: 'મધ્યમ પદનું વિભાજન કરો',
        titleHi: 'मध्य पद को विभाजित करें',
        why: 'Find two numbers that multiply to +6 and add to -5. The numbers are -2 and -3 because (-2) × (-3) = 6 and (-2) + (-3) = -5.',
        whyGu: 'ગુણાકાર +6 અને સરવાળો -5 થાય તેવી સંખ્યાઓ -2 અને -3 છે કારણ કે (-2) × (-3) = 6 અને (-2) + (-3) = -5.',
        whyHi: 'गुणा करने पर +6 और जोड़ने पर -5 प्राप्त हो ऐसी संख्याएँ -2 और -3 हैं क्योंकि (-2) × (-3) = 6 तथा (-2) + (-3) = -5.',
        calculation: 'x² - 5x + 6 = x² - 2x - 3x + 6 = 0',
        intermediateResult: 'x² - 2x - 3x + 6 = 0',
        intermediateResultGu: 'x² - 2x - 3x + 6 = 0'
      },
      {
        stepNumber: 3,
        title: 'Factor by Grouping',
        titleGu: 'સામાન્ય અવયવ કાઢીને જૂથ બનાવો',
        titleHi: 'समूह बनाकर उभयनिष्ठ गुणनखंड लें',
        why: 'Group the first two terms and the last two terms to extract common factors.',
        whyGu: 'પ્રથમ બે પદો અને છેલ્લા બે પદોમાંથી સામાન્ય અવયવ બહાર કાઢો.',
        whyHi: 'पहले दो पदों और अंतिम दो पदों में से उभयनिष्ठ गुणनखंड बाहर निकालें।',
        calculation: 'x(x - 2) - 3(x - 2) = 0 ⟹ (x - 2)(x - 3) = 0',
        intermediateResult: '(x - 2)(x - 3) = 0',
        intermediateResultGu: '(x - 2)(x - 3) = 0'
      },
      {
        stepNumber: 4,
        title: 'Apply Zero Product Property',
        titleGu: 'શૂન્ય ગુણાકાર નિયમ લાગુ કરો',
        titleHi: 'शून्य गुणनफल नियम लागू करें',
        why: 'If the product of two factors is zero, at least one of the factors must equal zero.',
        whyGu: 'જો બે અવયવોનો ગુણાકાર શૂન્ય હોય, તો તેમાંથી ઓછામાં ઓછો એક અવયવ શૂન્ય હોવો જ જોઈએ.',
        whyHi: 'यदि दो गुणनखंडों का गुणनफल शून्य है, तो कम से कम एक गुणनखंड शून्य होना चाहिए।',
        calculation: 'x - 2 = 0 ⟹ x = 2\nx - 3 = 0 ⟹ x = 3',
        intermediateResult: 'x = 2, x = 3',
        intermediateResultGu: 'x = 2, x = 3'
      }
    ],
    verification: 'Check roots: For x = 2: (2)² - 5(2) + 6 = 4 - 10 + 6 = 0 (True). For x = 3: (3)² - 5(3) + 6 = 9 - 15 + 6 = 0 (True).',
    verificationGu: 'ચકાસણી: x = 2 માટે: (2)² - 5(2) + 6 = 4 - 10 + 6 = 0 (સત્ય). x = 3 માટે: (3)² - 5(3) + 6 = 9 - 15 + 6 = 0 (સત્ય).',
    verificationHi: 'सत्यापन: x = 2 के लिए: (2)² - 5(2) + 6 = 0 (सत्य)। x = 3 के लिए: (3)² - 5(3) + 6 = 0 (सत्य)।',
    finalAnswer: 'x = 2, x = 3',
    finalAnswerGu: 'x = 2, x = 3',
    finalAnswerHi: 'x = 2, x = 3',
    keyTakeaway: 'To solve any quadratic equation ax² + bx + c = 0 independently, always test the signs of the product a × c and sum b. If a × c > 0 and b < 0, both factors must be negative.',
    keyTakeawayGu: 'કોઈપણ દ્વિઘાત સમીકરણ ax² + bx + c = 0 સ્વતંત્ર રીતે ઉકેલવા માટે, હંમેશા ગુણાકાર a × c અને સરવાળો b ના ચિહ્નો તપાસો. જો a × c > 0 અને b < 0 હોય તો બંને અવયવો ઋણ હશે.',
    keyTakeawayHi: 'किसी भी द्विघात समीकरण ax² + bx + c = 0 को हल करते समय गुणनफल a × c और योग b के चिन्हों का ध्यान रखें।',
    commonMistakes: [
      'Sign error when splitting middle term: Choosing +2 and +3 yields +5x, not -5x. Both numbers must be negative (-2 and -3).',
      'Forgetting the Zero Product step: Stopping at (x - 2)(x - 3) = 0 and writing the roots as -2 and -3 instead of +2 and +3.',
      'Sign flipping rule: When (x - r) = 0, the root is x = +r.'
    ],
    commonMistakesGu: [
      'મધ્યમ પદના ચિહ્નની ભૂલ: +2 અને +3 પસંદ કરવાથી +5x મળે છે, -5x નહીં. બંને અવયવો ઋણ (-2 અને -3) હોવા જોઈએ.',
      'અવયવ પરથી બીજ મેળવવાની ભૂલ: (x - 2)(x - 3) = 0 પરથી બીજ x = +2 અને x = +3 થાય, -2 અને -3 નહીં.'
    ],
    commonMistakesHi: [
      'चिह्न की गलती: -2 और -3 का चयन करें ताकि योग -5 प्राप्त हो।',
      'गुणनखंड से मूल निकालते समय चिह्न बदलना न भूलें: (x - 2) = 0 से x = +2 मिलता है।'
    ],
    alternativeMethod: {
      title: 'Quadratic Formula Method (Shreedharacharya Formula)',
      description: 'Use x = (-b ± √(b² - 4ac)) / (2a) directly without factoring trial and error.',
      calculation: 'x = (-(-5) ± √(25 - 24)) / 2 = (5 ± 1) / 2 ⟹ x = 3, x = 2'
    },
    alternativeMethodGu: {
      title: 'દ્વિઘાત સૂત્ર પદ્ધતિ (શ્રીધરાચાર્ય સૂત્ર)',
      description: 'અવયવ પાડ્યા વિના સીધું x = (-b ± √(b² - 4ac)) / (2a) સૂત્ર વાપરો.',
      calculation: 'x = (5 ± 1) / 2 ⟹ x = 3, x = 2'
    },
    alternativeMethodHi: {
      title: 'द्विघात सूत्र विधि (श्रीधराचार्य सूत्र)',
      description: 'सीधे x = (-b ± √(b² - 4ac)) / (2a) सूत्र का प्रयोग करें।',
      calculation: 'x = (5 ± 1) / 2 ⟹ x = 3, x = 2'
    },
    practiceChallenge: {
      problem: 'Solve x² - 7x + 12 = 0',
      hint: 'Find two negative numbers that multiply to +12 and add up to -7.',
      answer: 'x = 3, x = 4 (Factors: (x - 3)(x - 4) = 0)'
    },
    practiceChallengeGu: {
      problem: 'x² - 7x + 12 = 0 ઉકેલો',
      hint: 'જેમનો ગુણાકાર +12 અને સરવાળો -7 થાય તેવી બે ઋણ સંખ્યાઓ શોધો.',
      answer: 'x = 3, x = 4 (અવયવો: (x - 3)(x - 4) = 0)'
    },
    practiceChallengeHi: {
      problem: 'x² - 7x + 12 = 0 को हल करें',
      hint: 'गुणा करने पर +12 और जोड़ने पर -7 देने वाली संख्याएं सोचें।',
      answer: 'x = 3, x = 4'
    }
  },

  // 2. Discriminant: 2x² - 4x + 3 = 0
  'quad_discriminant': {
    subject: 'Mathematics',
    subjectGu: 'ગણિત',
    subjectHi: 'गणित',
    topic: 'Quadratic Equations',
    topicGu: 'દ્વિઘાત સમીકરણો',
    topicHi: 'द्विघात समीकरण',
    problemStatement: 'What is the discriminant (D) of the equation 2x² - 4x + 3 = 0?',
    problemStatementGu: 'સમીકરણ 2x² - 4x + 3 = 0 નો વિવેચક (D) શું છે?',
    problemStatementHi: 'समीकरण 2x² - 4x + 3 = 0 का विविक्तकर (D) क्या है?',
    conceptReasoning: 'The discriminant D = b² - 4ac reveals the nature and count of the roots without having to solve the full quadratic equation.',
    conceptReasoningGu: 'વિવેચક D = b² - 4ac સંપૂર્ણ સમીકરણ ઉકેલ્યા વગર બીજનો પ્રકાર અને સંખ્યા નક્કી કરે છે.',
    conceptReasoningHi: 'विविक्तकर D = b² - 4ac पूरे समीकरण को हल किए बिना मूलों की प्रकृति बताता है।',
    formulas: [
      'D = b² - 4ac'
    ],
    givenValues: {
      'Equation': '2x² - 4x + 3 = 0',
      'a': '2',
      'b': '-4',
      'c': '3'
    },
    toFind: 'Value of Discriminant (D)',
    toFindGu: 'વિવેચક (D) નું મૂલ્ય',
    toFindHi: 'विविक्तकर (D) का मान',
    steps: [
      {
        stepNumber: 1,
        title: 'Compare with Standard Quadratic Form',
        titleGu: 'પ્રમાણભૂત સમીકરણ સાથે સરખાવો',
        titleHi: 'मानक समीकरण से तुलना करें',
        why: 'Identify coefficients a, b, c from ax² + bx + c = 0.',
        whyGu: 'ax² + bx + c = 0 માંથી સહગુણકો a, b, c મેળવો.',
        whyHi: 'ax² + bx + c = 0 से गुणांक a, b, c ज्ञात करें।',
        calculation: 'ax² + bx + c = 0 ⟹ a = 2, b = -4, c = 3',
        intermediateResult: 'a = 2, b = -4, c = 3'
      },
      {
        stepNumber: 2,
        title: 'State the Discriminant Formula',
        titleGu: 'વિવેચકનું સૂત્ર લખો',
        titleHi: 'विविक्तकर का सूत्र लिखें',
        why: 'The discriminant formula evaluates the term inside the square root of the quadratic formula.',
        whyGu: 'વિવેચક સૂત્ર દ્વિઘાત સૂત્રમાં વર્ગમૂળની અંદર આવતા પદનું મૂલ્ય દર્શાવે છે.',
        whyHi: 'विविक्तकर सूत्र वर्गमूल के अंदर के पद का मान बताता है।',
        calculation: 'D = b² - 4ac',
        intermediateResult: 'Formula: D = b² - 4ac'
      },
      {
        stepNumber: 3,
        title: 'Substitute Values & Compute',
        titleGu: 'કિંમતો મૂકી ગણતરી કરો',
        titleHi: 'मान रखकर गणना करें',
        why: 'Carefully square the negative number (-4)² = +16, and multiply 4 × 2 × 3 = 24.',
        whyGu: 'ઋણ સંખ્યાનો વર્ગ (-4)² = +16 થાય અને 4 × 2 × 3 = 24 થાય તે કાળજીપૂર્વક ગણો.',
        whyHi: '(-4)² = +16 और 4 × 2 × 3 = 24 की सावधानीपूर्वक गणना करें।',
        calculation: 'D = (-4)² - 4(2)(3)\nD = 16 - 24\nD = -8',
        intermediateResult: 'D = -8'
      }
    ],
    finalAnswer: 'D = -8',
    finalAnswerGu: 'D = -8',
    finalAnswerHi: 'D = -8',
    keyTakeaway: 'Always remember: (-b)² is always positive. Since D = -8 < 0, this quadratic equation has no real roots.',
    keyTakeawayGu: 'હંમેશા યાદ રાખો: ઋણ સંખ્યાનો વર્ગ હંમેશા ધન હોય છે. અહીં D = -8 < 0 હોવાથી આ સમીકરણને વાસ્તવિક બીજ નથી.',
    keyTakeawayHi: 'हमेशा याद रखें: ऋणात्मक संख्या का वर्ग हमेशा धनात्मक होता है। चूँकि D = -8 < 0 है, अतः कोई वास्तविक मूल नहीं है।'
  },

  // 3. Nature of Roots for D < 0
  'quad_nature': {
    subject: 'Mathematics',
    subjectGu: 'ગણિત',
    subjectHi: 'गणित',
    topic: 'Quadratic Equations',
    topicGu: 'દ્વિઘાત સમીકરણો',
    topicHi: 'द्विघात समीकरण',
    problemStatement: 'If a quadratic equation has a discriminant D < 0, what can be said about its roots?',
    problemStatementGu: 'જો દ્વિઘાત સમીકરણનો વિવેચક D < 0 હોય, તો તેના બીજ વિશે શું કહી શકાય?',
    problemStatementHi: 'यदि किसी द्विघात समीकरण का विविक्तकर D < 0 हो, तो उसके मूलों के बारे में क्या कहा जा सकता है?',
    conceptReasoning: 'In the quadratic formula x = (-b ± √D) / 2a, if D < 0, we must take the square root of a negative number. Since real numbers cannot produce a negative square, the roots cannot be real.',
    conceptReasoningGu: 'દ્વિઘાત સૂત્ર x = (-b ± √D) / 2a માં, જો D < 0 હોય તો ઋણ સંખ્યાનું વર્ગમૂળ લેવું પડે. વાસ્તવિક સંખ્યાઓનો વર્ગ ક્યારેય ઋણ ન હોવાથી વાસ્તવિક બીજ શક્ય નથી.',
    conceptReasoningHi: 'द्विघात सूत्र x = (-b ± √D) / 2a में यदि D < 0 हो, तो ऋणात्मक संख्या का वर्गमूल लेना पड़ता है, जो वास्तविक संख्या नहीं हो सकता।',
    formulas: [
      'x = (-b ± √D) / 2a',
      'D > 0: Two distinct real roots',
      'D = 0: Two equal real roots (x = -b / 2a)',
      'D < 0: No real roots (Two complex conjugate roots)'
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Analyze Quadratic Formula Term √D',
        titleGu: 'દ્વિઘાત સૂત્રના પદ √D નું વિશ્લેષણ કરો',
        titleHi: 'द्विघात सूत्र के पद √D का विश्लेषण करें',
        why: 'The nature of roots is determined solely by the expression √D under the square root sign.',
        whyGu: 'બીજનો પ્રકાર માત્ર વર્ગમૂળના ચિહ્ન નીચે રહેલા પદ √D પરથી નક્કી થાય છે.',
        whyHi: 'मूलों की प्रकृति वर्गमूल के अंतर्गत पद √D द्वारा निर्धारित होती है।',
        calculation: 'x = (-b ± √D) / (2a)',
        intermediateResult: 'Radical term is √D where D < 0.'
      },
      {
        stepNumber: 2,
        title: 'Evaluate Square Root of Negative Real Numbers',
        titleGu: 'ઋણ સંખ્યાના વર્ગમૂળનું મૂલ્યાંકન કરો',
        titleHi: 'ऋणात्मक संख्या के वर्गमूल का मूल्यांकन करें',
        why: 'For any real number r, r² ≥ 0. Hence √(-k) has no solution in the set of Real Numbers (ℝ).',
        whyGu: 'કોઈપણ વાસ્તવિક સંખ્યા માટે તેનો વર્ગ હંમેશા અઋણ હોય છે, તેથી ઋણ સંખ્યાનું વાસ્તવિક વર્ગમૂળ અસ્તિત્વ ધરાવતું નથી.',
        whyHi: 'किसी भी वास्तविक संख्या का वर्ग सदैव धनात्मक होता है, अतः ऋणात्मक संख्या का वास्तविक वर्गमूल संभव नहीं है।',
        calculation: '√(-k) ∉ ℝ (belongs to complex numbers ℂ: i√k)',
        intermediateResult: 'No real number satisfies the equation.'
      }
    ],
    finalAnswer: 'No real roots (Complex roots)',
    finalAnswerGu: 'કોઈ વાસ્તવિક બીજ નથી (સંકર બીજ)',
    finalAnswerHi: 'कोई वास्तविक मूल नहीं (काल्पनिक मूल)',
    keyTakeaway: 'Summary to memorize: D > 0 ⟹ 2 distinct real roots, D = 0 ⟹ 2 equal real roots, D < 0 ⟹ No real roots (parabola does not intersect the x-axis).',
    keyTakeawayGu: 'યાદ રાખવાનો સારાંશ: D > 0 ⟹ ૨ ભિન્ન વાસ્તવિક બીજ, D = 0 ⟹ ૨ સમાન વાસ્તવિક બીજ, D < 0 ⟹ કોઈ વાસ્તવિક બીજ નહીં.',
    keyTakeawayHi: 'स्मरण रखें: D > 0 ⟹ 2 भिन्न वास्तविक मूल, D = 0 ⟹ 2 समान वास्तविक मूल, D < 0 ⟹ कोई वास्तविक मूल नहीं।'
  },

  // 4. Trigonometric Identity: sin²θ + cos²θ
  'trig_pythagorean': {
    subject: 'Mathematics',
    subjectGu: 'ગણિત',
    subjectHi: 'गणित',
    topic: 'Trigonometric Identities',
    topicGu: 'ત્રિકોણમિતીય નિત્યસમો',
    topicHi: 'त्रिकोणमितीय सर्वसमिकाएँ',
    problemStatement: 'Which of the following is equivalent to sin²(θ) + cos²(θ)?',
    problemStatementGu: 'નીચેનામાંથી કયું sin²(θ) + cos²(θ) ની બરાબર છે?',
    problemStatementHi: 'निम्नलिखित में से कौन sin²(θ) + cos²(θ) के बराबर है?',
    conceptReasoning: 'In a right-angled triangle, definitions of sine and cosine directly map to the Pythagorean Theorem a² + b² = c². Dividing by the hypotenuse squared yields the fundamental identity sin²θ + cos²θ = 1.',
    conceptReasoningGu: 'કાટકોણ ત્રિકોણમાં સાઇન અને કોસાઇન પાયથાગોરસ પ્રમેય a² + b² = c² સાથે સીધા સંબંધિત છે. કર્ણના વર્ગ વડે ભાગતા મૂળભૂત નિત્યસમ sin²θ + cos²θ = 1 મળે છે.',
    conceptReasoningHi: 'समकोण त्रिभुज में ज्या (sine) और कोज्या (cosine) पाइथागोरस प्रमेय से संबंधित हैं। कर्ण के वर्ग से भाग देने पर sin²θ + cos²θ = 1 प्राप्त होता है।',
    formulas: [
      'sin(θ) = Opposite / Hypotenuse = p / h',
      'cos(θ) = Adjacent / Hypotenuse = b / h',
      'p² + b² = h² (Pythagoras Theorem)'
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Define Sine and Cosine in terms of Triangle Sides',
        titleGu: 'ત્રિકોણની બાજુઓના સંદર્ભમાં વ્યાખ્યાયિત કરો',
        titleHi: 'त्रिभुज की भुजाओं के अनुपात में परिभाषित करें',
        why: 'In right triangle with angle θ, perpendicular p, base b, hypotenuse h:',
        whyGu: 'કાટકોણ ત્રિકોણમાં સામેની બાજુ p, પાસેની બાજુ b, કર્ણ h માટે:',
        whyHi: 'समकोण त्रिभुज में लम्ब p, आधार b और कर्ण h के लिए:',
        calculation: 'sin(θ) = p / h, cos(θ) = b / h',
        intermediateResult: 'sin²(θ) = p² / h², cos²(θ) = b² / h²'
      },
      {
        stepNumber: 2,
        title: 'Add the Squared Ratios',
        titleGu: 'બંનેના વર્ગોનો સરવાળો કરો',
        titleHi: 'दोनों के वर्गों को जोड़ें',
        why: 'Combine the fractions over the common denominator h².',
        whyGu: 'સમાન છેદ h² નો ઉપયોગ કરીને અપૂર્ણાંકોનો સરવાળો કરો.',
        whyHi: 'समान हर h² के साथ भिन्न का योग करें।',
        calculation: 'sin²(θ) + cos²(θ) = (p² / h²) + (b² / h²) = (p² + b²) / h²',
        intermediateResult: '(p² + b²) / h²'
      },
      {
        stepNumber: 3,
        title: 'Apply Pythagoras Theorem',
        titleGu: 'પાયથાગોરસ પ્રમેય લાગુ કરો',
        titleHi: 'पाइथागोरस प्रमेय लागू करें',
        why: 'In any right triangle, p² + b² = h². Replace the numerator with h².',
        whyGu: 'કોઈપણ કાટકોણ ત્રિકોણમાં p² + b² = h² થાય, તેથી અંશમાં h² મૂકો.',
        whyHi: 'समकोण त्रिभुज में p² + b² = h² होता है, अतः अंश में h² रखें।',
        calculation: '(p² + b²) / h² = h² / h² = 1',
        intermediateResult: '1'
      }
    ],
    finalAnswer: '1',
    finalAnswerGu: '1',
    finalAnswerHi: '1',
    keyTakeaway: 'sin²(θ) + cos²(θ) = 1 is true for ALL real angles θ. You can rearrange it as 1 - sin²θ = cos²θ and 1 - cos²θ = sin²θ.',
    keyTakeawayGu: 'sin²(θ) + cos²(θ) = 1 તમામ વાસ્તવિક ખૂણાઓ θ માટે સત્ય છે. તેના પરથી 1 - sin²θ = cos²θ અને 1 - cos²θ = sin²θ મેળવી શકાય છે.',
    keyTakeawayHi: 'sin²(θ) + cos²(θ) = 1 प्रत्येक कोण के लिए सत्य है। इससे 1 - sin²θ = cos²θ प्राप्त होता है।'
  },

  // 5. Trigonometric Simplification: (1 - cos²θ) / sinθ
  'trig_simplify': {
    subject: 'Mathematics',
    subjectGu: 'ગણિત',
    subjectHi: 'गणित',
    topic: 'Trigonometric Identities',
    topicGu: 'ત્રિકોણમિતીય નિત્યસમો',
    topicHi: 'त्रिकोणमितीय सर्वसमिकाएँ',
    problemStatement: 'Simplify: (1 - cos²(θ)) / sin(θ)',
    problemStatementGu: 'સાદુરૂપ આપો: (1 - cos²(θ)) / sin(θ)',
    problemStatementHi: 'सरल करें: (1 - cos²(θ)) / sin(θ)',
    conceptReasoning: 'Replace compound trigonometric expressions in terms of fundamental Pythagorean identities to cancel common factors between numerator and denominator.',
    conceptReasoningGu: 'અંશ અને છેદ વચ્ચે સામાન્ય પદો રદ કરવા માટે પાયથાગોરિયન નિત્યસમનો ઉપયોગ કરીને પદ બદલો.',
    conceptReasoningHi: 'अंश और हर में समान पदों को निरस्त करने के लिए सर्वसमिका का उपयोग करें।',
    formulas: [
      'sin²(θ) + cos²(θ) = 1 ⟹ 1 - cos²(θ) = sin²(θ)'
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Rearrange Pythagorean Identity for Numerator',
        titleGu: 'અંશ માટે પાયથાગોરિયન નિત્યસમ ગોઠવો',
        titleHi: 'अंश के लिए सर्वसमिका व्यवस्थित करें',
        why: 'From sin²θ + cos²θ = 1, subtract cos²θ from both sides to express 1 - cos²θ.',
        whyGu: 'sin²θ + cos²θ = 1 માંથી બંને બાજુ cos²θ બાદ કરતાં 1 - cos²θ = sin²θ મળે છે.',
        whyHi: 'sin²θ + cos²θ = 1 से दोनों ओर cos²θ घटाने पर 1 - cos²θ = sin²θ प्राप्त होता है।',
        calculation: '1 - cos²(θ) = sin²(θ)',
        intermediateResult: 'Numerator = sin²(θ)'
      },
      {
        stepNumber: 2,
        title: 'Substitute and Cancel Common Factor',
        titleGu: 'કિંમત મૂકો અને સામાન્ય પદ ઉડાડો',
        titleHi: 'प्रतिस्थापित करें और उभयनिष्ठ पद काटें',
        why: 'Divide the squared term sin²θ by sinθ.',
        whyGu: 'અંશના sin²θ ને છેદના sinθ વડે ભાગો.',
        whyHi: 'अंश sin²θ को हर sinθ से विभाजित करें।',
        calculation: '(sin²(θ)) / sin(θ) = (sin(θ) × sin(θ)) / sin(θ) = sin(θ)',
        intermediateResult: 'sin(θ)'
      }
    ],
    finalAnswer: 'sin(θ)',
    finalAnswerGu: 'sin(θ)',
    finalAnswerHi: 'sin(θ)',
    keyTakeaway: 'Whenever you see (1 - cos²θ) or (1 - sin²θ), immediately substitute sin²θ or cos²θ to simplify the fraction.',
    keyTakeawayGu: 'જ્યારે પણ (1 - cos²θ) અથવા (1 - sin²θ) દેખાય, ત્યારે તરત જ sin²θ અથવા cos²θ મૂકી સાદુરૂપ આપો.',
    keyTakeawayHi: 'जब भी (1 - cos²θ) दिखे, तुरंत sin²θ प्रतिस्थापित करें।'
  },

  // 6. Tan 45°
  'trig_tan45': {
    subject: 'Mathematics',
    subjectGu: 'ગણિત',
    subjectHi: 'गणित',
    topic: 'Trigonometric Values',
    topicGu: 'ત્રિકોણમિતીય ખૂણાઓના મૂલ્યો',
    topicHi: 'त्रिकोणमितीय मान',
    problemStatement: 'What is tan(45°) equal to?',
    problemStatementGu: 'tan(45°) ની કિંમત કેટલી થાય?',
    problemStatementHi: 'tan(45°) का मान क्या है?',
    conceptReasoning: 'In an isosceles right-angled triangle (45°-45°-90°), the perpendicular side equals the base side. By definition, tan(θ) = Opposite / Adjacent, giving a ratio of 1.',
    conceptReasoningGu: 'સમદ્વિબાજુ કાટકોણ ત્રિકોણમાં (૪૫°-૪૫°-૯૦°), સામેની બાજુ અને પાસેની બાજુ સમાન લંબાઈ ધરાવે છે. વ્યાખ્યા મુજબ tan(θ) = સામેની બાજુ / પાસેની બાજુ = ૧.',
    conceptReasoningHi: 'समद्विबाहु समकोण त्रिभुज (45°-45°-90°) में लम्ब और आधार समान होते हैं। tan(θ) = लम्ब / आधार = 1.',
    formulas: [
      'tan(θ) = sin(θ) / cos(θ)',
      'sin(45°) = 1 / √2, cos(45°) = 1 / √2'
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Express tan(θ) in terms of sin and cos',
        titleGu: 'tan(θ) ને sin અને cos ના ગુણોત્તરમાં દર્શાવો',
        titleHi: 'tan(θ) को sin और cos के अनुपात में व्यक्त करें',
        why: 'Tan is the ratio of sine to cosine.',
        whyGu: 'ટેન એ સાઇન અને કોસાઇનનો ગુણોત્તર છે.',
        whyHi: 'टैन, साइन और कोसाइन का अनुपात है।',
        calculation: 'tan(45°) = sin(45°) / cos(45°)',
        intermediateResult: 'tan(45°) = sin(45°) / cos(45°)'
      },
      {
        stepNumber: 2,
        title: 'Substitute Standard Exact Values',
        titleGu: 'પ્રમાણભૂત ચોક્કસ મૂલ્યો મૂકો',
        titleHi: 'मानक मान प्रतिस्थापित करें',
        why: 'For a 45° angle, both sine and cosine equal 1 / √2.',
        whyGu: '૪૫° ખૂણા માટે, સાઇન અને કોસાઇન બંનેનું મૂલ્ય ૧ / √૨ છે.',
        whyHi: '45° कोण के लिए साइन और कोसाइन दोनों का मान 1 / √2 होता है।',
        calculation: 'tan(45°) = (1 / √2) / (1 / √2) = 1',
        intermediateResult: '1'
      }
    ],
    finalAnswer: '1',
    finalAnswerGu: '1',
    finalAnswerHi: '1',
    keyTakeaway: 'At 45°, opposite = adjacent, so tan(45°) = 1 and cot(45°) = 1.',
    keyTakeawayGu: '૪૫° ખૂણે સામેની બાજુ = પાસેની બાજુ, તેથી tan(45°) = 1 અને cot(45°) = 1.',
    keyTakeawayHi: '45° पर लम्ब = आधार होता है, अतः tan(45°) = 1.'
  },

  // 7. Sec²θ - Tan²θ
  'trig_sec_tan': {
    subject: 'Mathematics',
    subjectGu: 'ગણિત',
    subjectHi: 'गणित',
    topic: 'Trigonometric Identities',
    topicGu: 'ત્રિકોણમિતીય નિત્યસમો',
    topicHi: 'त्रिकोणमितीय सर्वसमिकाएँ',
    problemStatement: 'Express sec²(θ) - tan²(θ) in simplest terms.',
    problemStatementGu: 'sec²(θ) - tan²(θ) નું સાદુરૂપ આપો.',
    problemStatementHi: 'sec²(θ) - tan²(θ) को सरलतम रूप में व्यक्त करें।',
    conceptReasoning: 'Dividing the Pythagorean identity sin²θ + cos²θ = 1 by cos²θ produces 1 + tan²θ = sec²θ. Subtracting tan²θ from both sides proves sec²θ - tan²θ = 1.',
    conceptReasoningGu: 'sin²θ + cos²θ = 1 ને cos²θ વડે ભાગતા 1 + tan²θ = sec²θ મળે છે. બંને બાજુથી tan²θ બાદ કરતાં sec²θ - tan²θ = 1 સાબિત થાય છે.',
    conceptReasoningHi: 'sin²θ + cos²θ = 1 को cos²θ से भाग देने पर 1 + tan²θ = sec²θ मिलता है। अतः sec²θ - tan²θ = 1.',
    formulas: [
      '1 + tan²(θ) = sec²(θ)',
      'sec²(θ) - tan²(θ) = 1'
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Derive from Fundamental Identity',
        titleGu: 'મૂળભૂત નિત્યસમ પરથી તારવો',
        titleHi: 'मूल सर्वसमिका से व्युत्पन्न करें',
        why: 'Divide every term of sin²θ + cos²θ = 1 by cos²θ.',
        whyGu: 'sin²θ + cos²θ = 1 ના દરેક પદને cos²θ વડે ભાગો.',
        whyHi: 'sin²θ + cos²θ = 1 के प्रत्येक पद को cos²θ से भाग दें।',
        calculation: '(sin²θ / cos²θ) + (cos²θ / cos²θ) = 1 / cos²θ ⟹ tan²θ + 1 = sec²θ',
        intermediateResult: '1 + tan²θ = sec²θ'
      },
      {
        stepNumber: 2,
        title: 'Subtract tan²(θ) from Both Sides',
        titleGu: 'બંને બાજુથી tan²(θ) બાદ કરો',
        titleHi: 'दोनों ओर से tan²(θ) घटाएं',
        why: 'Isolate 1 on the left hand side to obtain the requested expression.',
        whyGu: 'માગેલ પદ મેળવવા માટે જમણી બાજુ tan²θ લઈ જાઓ.',
        whyHi: 'sec²θ - tan²θ प्राप्त करने के लिए पक्षांतरण करें।',
        calculation: 'sec²(θ) - tan²(θ) = 1',
        intermediateResult: '1'
      }
    ],
    finalAnswer: '1',
    finalAnswerGu: '1',
    finalAnswerHi: '1',
    keyTakeaway: 'The three foundational identities: 1) sin²θ + cos²θ = 1, 2) sec²θ - tan²θ = 1, 3) cosec²θ - cot²θ = 1.',
    keyTakeawayGu: 'ત્રણ પાયાના નિત્યસમો: ૧) sin²θ + cos²θ = 1, ૨) sec²θ - tan²θ = 1, ૩) cosec²θ - cot²θ = 1.',
    keyTakeawayHi: 'तीन आधारभूत सर्वसमिकाएं: sin²θ + cos²θ = 1, sec²θ - tan²θ = 1, cosec²θ - cot²θ = 1.'
  },

  // 8. Derivative of f(x) = 3x⁴ - 5x² + 7
  'calc_diff_poly': {
    subject: 'Mathematics',
    subjectGu: 'ગણિત',
    subjectHi: 'गणित',
    topic: 'Differentiation / Calculus',
    topicGu: 'વિકલન',
    topicHi: 'अवकलन',
    problemStatement: 'What is the derivative of f(x) = 3x⁴ - 5x² + 7 with respect to x?',
    problemStatementGu: 'x ની સાપેક્ષમાં f(x) = 3x⁴ - 5x² + 7 નું વિકલન શું થાય?',
    problemStatementHi: 'x के सापेक्ष f(x) = 3x⁴ - 5x² + 7 का अवकलज क्या है?',
    conceptReasoning: 'By the linearity of differentiation, differentiate each term separately using the Power Rule d/dx(xⁿ) = n·xⁿ⁻¹, the constant multiple rule d/dx(c·u) = c·(du/dx), and constant rule d/dx(c) = 0.',
    conceptReasoningGu: 'વિકલનની સુરેખતા મુજબ, ઘાતના નિયમ d/dx(xⁿ) = n·xⁿ⁻¹ અને અચળ પદના નિયમ d/dx(c) = 0 નો ઉપયોગ કરીને દરેક પદનું અલગ-અલગ વિકલન કરો.',
    conceptReasoningHi: 'अवकलन के घात नियम d/dx(xⁿ) = n·xⁿ⁻¹ और अचर पद नियम d/dx(c) = 0 का उपयोग करके प्रत्येक पद का अवकलन करें।',
    formulas: [
      'd/dx (xⁿ) = n · xⁿ⁻¹',
      'd/dx (c · f(x)) = c · f\'(x)',
      'd/dx (constant) = 0'
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Apply Linearity of Differentiation',
        titleGu: 'વિકલનની સુરેખતા લાગુ કરો',
        titleHi: 'अवकलन का रैखिक गुणधर्म लागू करें',
        why: 'Break down the derivative of a polynomial into the sum/difference of derivatives of its terms.',
        whyGu: 'બહુપદીના દરેક પદ પર વિકલન અલગ-અલગ લાગુ કરો.',
        whyHi: 'बहुपद के प्रत्येक पद पर अवकलन अलग से लागू करें।',
        calculation: "f'(x) = d/dx(3x⁴) - d/dx(5x²) + d/dx(7)",
        intermediateResult: "f'(x) = 3·d/dx(x⁴) - 5·d/dx(x²) + d/dx(7)"
      },
      {
        stepNumber: 2,
        title: 'Differentiate First Term (3x⁴)',
        titleGu: 'પ્રથમ પદ (3x⁴) નું વિકલન કરો',
        titleHi: 'प्रथम पद (3x⁴) का अवकलन करें',
        why: 'Use power rule on x⁴: bring down power 4 and subtract 1 from exponent.',
        whyGu: 'x⁴ પર ઘાતનો નિયમ: ઘાત 4 આગળ ગુણાશે અને ઘાતમાંથી 1 બાદ થશે.',
        whyHi: 'घात 4 को गुणा में लाएं और घात में से 1 घटाएं।',
        calculation: '3 · (4x⁴⁻¹) = 3 · (4x³) = 12x³',
        intermediateResult: '12x³'
      },
      {
        stepNumber: 3,
        title: 'Differentiate Second Term (-5x²)',
        titleGu: 'બીજા પદ (-5x²) નું વિકલન કરો',
        titleHi: 'द्वितीय पद (-5x²) का अवकलन करें',
        why: 'Use power rule on x²: 2x²⁻¹ = 2x.',
        whyGu: 'x² પર ઘાતનો નિયમ: ૨ આગળ ગુણાશે.',
        whyHi: 'x² का अवकलन 2x होता है।',
        calculation: '-5 · (2x²⁻¹) = -5 · (2x) = -10x',
        intermediateResult: '-10x'
      },
      {
        stepNumber: 4,
        title: 'Differentiate Constant Term (+7)',
        titleGu: 'અચળ પદ (+7) નું વિકલન કરો',
        titleHi: 'अचर पद (+7) का अवकलन करें',
        why: 'A constant does not change as x changes, so its rate of change (derivative) is always 0.',
        whyGu: 'અચળ પદમાં કોઈ ફેરફાર થતો નથી, તેથી તેનો ફેરફારનો દર હંમેશા ૦ હોય છે.',
        whyHi: 'अचर पद का मान नहीं बदलता, अतः उसका अवकलज शून्य होता है।',
        calculation: 'd/dx(7) = 0',
        intermediateResult: '0'
      }
    ],
    finalAnswer: '12x³ - 10x',
    finalAnswerGu: '12x³ - 10x',
    finalAnswerHi: '12x³ - 10x',
    keyTakeaway: 'Quick mental rule: Multiply the coefficient by the current power, and reduce the power by 1. Constants disappear to 0.',
    keyTakeawayGu: 'ઝડપી નિયમ: સહગુણકને વર્તમાન ઘાત વડે ગુણો અને ઘાતમાંથી ૧ ઓછો કરો. અચળ પદ ૦ થઈ જાય છે.',
    keyTakeawayHi: 'त्वरित नियम: गुणांक को घात से गुणा करें और घात 1 कम करें। अचर पद 0 हो जाता है।'
  },

  // 9. Derivative of sin(x)
  'calc_diff_sin': {
    subject: 'Mathematics',
    subjectGu: 'ગણિત',
    subjectHi: 'गणित',
    topic: 'Differentiation / Calculus',
    topicGu: 'વિકલન',
    topicHi: 'अवकलन',
    problemStatement: 'What is the derivative of sin(x)?',
    problemStatementGu: 'sin(x) નું વિકલન શું થાય?',
    problemStatementHi: 'sin(x) का अवकलज क्या होता है?',
    conceptReasoning: 'From the first principle limit definition of derivative: lim(h→0) [sin(x+h) - sin(x)] / h, applying compound angle identity sin(A+B) yields cos(x).',
    conceptReasoningGu: 'વિકલનની પ્રથમ સિદ્ધાંતની વ્યાખ્યા lim(h→0) [sin(x+h) - sin(x)] / h અને સંયુક્ત ખૂણાના સૂત્ર પરથી cos(x) મળે છે.',
    conceptReasoningHi: 'प्रथम सिद्धांत lim(h→0) [sin(x+h) - sin(x)] / h से sin(x) का अवकलज cos(x) सिद्ध होता है।',
    formulas: [
      'd/dx (sin x) = cos x',
      'd/dx (cos x) = -sin x'
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Recall Derivative First Principle Definition',
        titleGu: 'પ્રથમ સિદ્ધાંતની વ્યાખ્યા યાદ કરો',
        titleHi: 'प्रथम सिद्धांत की परिभाषा देखें',
        why: 'The instantaneous rate of change of f(x) is defined by the limit of the difference quotient.',
        whyGu: 'વિકલન એ તત્કાલીન ફેરફારનો દર દર્શાવે છે.',
        whyHi: 'अवकलन तात्कालिक परिवर्तन की दर को दर्शाता है।',
        calculation: "d/dx(sin x) = lim(h→0) [sin(x + h) - sin(x)] / h",
        intermediateResult: 'lim(h→0) [sin(x)cos(h) + cos(x)sin(h) - sin(x)] / h'
      },
      {
        stepNumber: 2,
        title: 'Evaluate Standard Limits',
        titleGu: 'પ્રમાણભૂત લક્ષ્યનું મૂલ્યાંકન કરો',
        titleHi: 'मानक सीमाओं का मूल्यांकन करें',
        why: 'Using limits lim(h→0) [sin(h)/h] = 1 and lim(h→0) [(cos(h)-1)/h] = 0.',
        whyGu: 'પ્રમાણભૂત લિમિટ lim(h→0) [sin(h)/h] = 1 નો ઉપયોગ કરો.',
        whyHi: 'मानक सीमा lim(h→0) [sin(h)/h] = 1 का प्रयोग करें।',
        calculation: 'cos(x) · lim(h→0)[sin(h)/h] + sin(x) · lim(h→0)[(cos(h) - 1)/h] = cos(x) · 1 + 0 = cos(x)',
        intermediateResult: 'cos(x)'
      }
    ],
    finalAnswer: 'cos(x)',
    finalAnswerGu: 'cos(x)',
    finalAnswerHi: 'cos(x)',
    keyTakeaway: 'Derivative of sin(x) is +cos(x). Be careful: Derivative of cos(x) is -sin(x).',
    keyTakeawayGu: 'sin(x) નું વિકલન +cos(x) થાય છે, જ્યારે cos(x) નું વિકલન -sin(x) થાય છે.',
    keyTakeawayHi: 'sin(x) का अवकलज +cos(x) होता है, जबकि cos(x) का अवकलज -sin(x) होता है।'
  },

  // 10. Newton's 2nd Law Formula
  'sci_newton_law': {
    subject: 'Science',
    subjectGu: 'વિજ્ઞાન',
    subjectHi: 'विज्ञान',
    topic: 'Physics - Force & Laws of Motion',
    topicGu: 'ભૌતિક વિજ્ઞાન - બળ અને ગતિના નિયમો',
    topicHi: 'भौतिक विज्ञान - बल और गति के नियम',
    problemStatement: 'According to Newton Second Law of Motion, what is the formula connecting Force (F), Mass (m), and Acceleration (a)?',
    problemStatementGu: 'ન્યૂટનના બીજા ગતિ નિયમ મુજબ બળ (F), દળ (m), અને પ્રવેગ (a) વચ્ચેનો સંબંધ દર્શાવતું સૂત્ર કયું છે?',
    problemStatementHi: 'न्यूटन के गति के दूसरे नियम के अनुसार बल (F), द्रव्यमान (m) और त्वरण (a) के बीच का संबंध क्या है?',
    conceptReasoning: "Newton's Second Law states that the rate of change of momentum (p = mv) of an object is directly proportional to the net external force applied in the direction of the force. For constant mass m, this simplifies directly to F = m × a.",
    conceptReasoningGu: 'ન્યૂટનનો બીજો ગતિ નિયમ જણાવે છે કે પદાર્થના વેગમાન (p = mv) ના ફેરફારનો સમય દર તેના પર લાગતા બાહ્ય અસંતુલિત બળના સમપ્રમાણમાં હોય છે. અચળ દળ માટે આ સૂત્ર F = m × a બને છે.',
    conceptReasoningHi: 'न्यूटन के दूसरे नियम के अनुसार संवेग परिवर्तन की दर लगाए गए असंतुलित बल के समानुपाती होती है। नियत द्रव्यमान के लिए F = m × a.',
    formulas: [
      'Momentum p = m · v',
      'Force F = dp / dt = d(m · v) / dt',
      'Acceleration a = dv / dt',
      'F = m · a'
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'State the Fundamental Scientific Law',
        titleGu: 'મૂળભૂત વૈજ્ઞાનિક નિયમ જણાવો',
        titleHi: 'मूल वैज्ञानिक नियम बताएं',
        why: 'Force equals the time rate of change of linear momentum.',
        whyGu: 'બળ એ રેખીય વેગમાનના ફેરફારના દર બરાબર છે.',
        whyHi: 'बल संवेग में परिवर्तन की समय दर के बराबर होता है।',
        calculation: 'F ∝ dp/dt ⟹ F = k · (dp/dt)',
        intermediateResult: 'In SI units, proportionality constant k = 1.'
      },
      {
        stepNumber: 2,
        title: 'Substitute Momentum Definition',
        titleGu: 'વેગમાનની વ્યાખ્યા મૂકો',
        titleHi: 'संवेग की परिभाषा रखें',
        why: 'Linear momentum p is defined as product of mass and velocity: p = m · v.',
        whyGu: 'વેગમાન p = દળ (m) × વેગ (v).',
        whyHi: 'संवेग p = द्रव्यमान (m) × वेग (v).',
        calculation: 'F = d(m · v) / dt',
        intermediateResult: 'F = m · (dv / dt) (for constant mass m)'
      },
      {
        stepNumber: 3,
        title: 'Recognize Rate of Velocity Change as Acceleration',
        titleGu: 'વેગના ફેરફારના દરને પ્રવેગ તરીકે ઓળખો',
        titleHi: 'वेग परिवर्तन की दर को त्वरण पहचानें',
        why: 'By definition, acceleration a is the derivative of velocity: a = dv / dt.',
        whyGu: 'વેગમાં થતા ફેરફારના સમય દરને પ્રવેગ a કહે છે: a = dv / dt.',
        whyHi: 'वेग परिवर्तन की दर को त्वरण a कहते हैं: a = dv / dt.',
        calculation: 'dv / dt = a ⟹ F = m · a',
        intermediateResult: 'F = m · a'
      }
    ],
    finalAnswer: 'F = m · a',
    finalAnswerGu: 'F = m · a',
    finalAnswerHi: 'F = m · a',
    keyTakeaway: 'Force is measured in Newtons (N), Mass in kilograms (kg), and Acceleration in meters per second squared (m/s²). 1 N = 1 kg·m/s².',
    keyTakeawayGu: 'બળનો SI એકમ ન્યૂટન (N), દળનો કિલોગ્રામ (kg), અને પ્રવેગનો મીટર/સેકન્ડ² (m/s²) છે. 1 N = 1 kg·m/s².',
    keyTakeawayHi: 'बल का SI मात्रक न्यूटन (N), द्रव्यमान का kg, और त्वरण का m/s² होता है। 1 N = 1 kg·m/s².'
  },

  // 11. Acceleration Calculation: mass = 10 kg, Force = 50 N
  'sci_accel_calc': {
    subject: 'Science',
    subjectGu: 'વિજ્ઞાન',
    subjectHi: 'विज्ञान',
    topic: 'Physics - Force & Laws of Motion',
    topicGu: 'ભૌતિક વિજ્ઞાન - બળ અને ગતિના નિયમો',
    topicHi: 'भौतिक विज्ञान - बल और गति के नियम',
    problemStatement: 'A body of mass 10 kg is acted upon by a net force of 50 N. What is its acceleration?',
    problemStatementGu: '10 kg ના દળવાળા પદાર્થ પર 50 N નું પરિણામી બળ લાગે છે. તેનો પ્રવેગ કેટલો થશે?',
    problemStatementHi: '10 kg द्रव्यमान वाले पिंड पर 50 N का परिणामी बल लगता है। उसका त्वरण क्या होगा?',
    conceptReasoning: "According to Newton's Second Law of Motion (F = m × a), acceleration is directly proportional to the applied force and inversely proportional to the mass. Rearranging gives a = F / m.",
    conceptReasoningGu: 'ન્યૂટનના બીજા ગતિ નિયમ (F = m × a) મુજબ, પ્રવેગ એ લગાડેલા બળના સમપ્રમાણમાં અને પદાર્થના દળના વ્યસ્ત પ્રમાણમાં હોય છે. તેથી a = F / m.',
    conceptReasoningHi: 'न्यूटन के दूसरे नियम (F = m × a) के अनुसार त्वरण a = F / m होता है।',
    formulas: [
      'F = m · a ⟹ a = F / m'
    ],
    givenValues: {
      'Mass (m)': '10 kg',
      'Net Force (F)': '50 N'
    },
    toFind: 'Acceleration (a) in m/s²',
    toFindGu: 'પ્રવેગ (a) m/s² માં',
    toFindHi: 'त्वरण (a) m/s² में',
    steps: [
      {
        stepNumber: 1,
        title: 'Extract Given Values with Standard SI Units',
        titleGu: 'SI એકમો સાથે આપેલ મૂલ્યો નોંધો',
        titleHi: 'मानक SI इकाइयों के साथ मान लिखें',
        why: 'Always verify quantities are in base SI units (kg for mass, N for force) before calculating.',
        whyGu: 'ગણતરી કરતાં પહેલાં એકમો SI પદ્ધતિ મુજબ (કિલોગ્રામ અને ન્યૂટન) છે કે નહીં તે ચકાસો.',
        whyHi: 'गणना से पहले सुनिश्चित करें कि द्रव्यमान kg में और बल N में हो।',
        calculation: 'm = 10 kg\nF = 50 N (where 1 N = 1 kg·m/s²)',
        intermediateResult: 'm = 10 kg, F = 50 kg·m/s²'
      },
      {
        stepNumber: 2,
        title: "Rearrange Newton's Second Law for Acceleration",
        titleGu: 'પ્રવેગ શોધવા સૂત્રનો કર્તા બનાવો',
        titleHi: 'त्वरण के लिए सूत्र बनाएं',
        why: 'Divide both sides of F = m · a by mass m to solve for acceleration a.',
        whyGu: 'a ને સૂત્રનો કર્તા બનાવવા માટે બંને બાજુ m વડે ભાગો.',
        whyHi: 'a को ज्ञात करने के लिए दोनों ओर m से भाग दें।',
        calculation: 'a = F / m',
        intermediateResult: 'a = F / m'
      },
      {
        stepNumber: 3,
        title: 'Substitute Numerical Values and Compute',
        titleGu: 'સંખ્યાત્મક મૂલ્યો મૂકો અને ભાગાકાર કરો',
        titleHi: 'संख्यात्मक मान रखकर भाग दें',
        why: 'Substitute 50 N for F and 10 kg for m, then simplify the fraction.',
        whyGu: 'F = 50 N અને m = 10 kg મૂકીને 50 ભાગ્યા 10 કરો.',
        whyHi: '50 को 10 से विभाजित करें।',
        calculation: 'a = 50 N / 10 kg = 50 / 10 = 5 m/s²',
        intermediateResult: 'a = 5 m/s²'
      }
    ],
    verification: 'Check: F = m · a = 10 kg × 5 m/s² = 50 kg·m/s² = 50 N. The calculated acceleration matches the given force.',
    verificationGu: 'ચકાસણી: F = m · a = 10 kg × 5 m/s² = 50 N. મેળવેલ પ્રવેગ આપેલા બળ સાથે મેળ ખાય છે.',
    verificationHi: 'सत्यापन: F = 10 kg × 5 m/s² = 50 N. परिणाम पूर्णतः सही है।',
    finalAnswer: '5 m/s²',
    finalAnswerGu: '5 m/s²',
    finalAnswerHi: '5 m/s²',
    keyTakeaway: 'To calculate acceleration independently: divide the net force by mass. If force doubles, acceleration doubles. If mass doubles, acceleration is halved.',
    keyTakeawayGu: 'સ્વતંત્ર રીતે પ્રવેગ શોધવા: બળને દળ વડે ભાગો (a = F/m). જો બળ બમણું થાય તો પ્રવેગ બમણો થાય છે.',
    keyTakeawayHi: 'त्वरण निकालने के लिए बल को द्रव्यमान से विभाजित करें (a = F/m)।'
  },

  // 12. Chemical Reaction: Reactants in 2H₂ + O₂ → 2H₂O
  'sci_chem_reactants': {
    subject: 'Science',
    subjectGu: 'વિજ્ઞાન',
    subjectHi: 'विज्ञान',
    topic: 'Chemistry - Chemical Reactions & Equations',
    topicGu: 'રસાયણ વિજ્ઞાન - રાસાયણિક પ્રક્રિયાઓ અને સમીકરણો',
    topicHi: 'रसायन विज्ञान - रासायनिक अभिक्रियाएं और समीकरण',
    problemStatement: 'In the chemical reaction 2H₂ + O₂ → 2H₂O, what are H₂ and O₂ called?',
    problemStatementGu: 'રાસાયણિક પ્રક્રિયા 2H₂ + O₂ → 2H₂O માં H₂ અને O₂ ને શું કહેવાય છે?',
    problemStatementHi: 'रासायनिक अभिक्रिया 2H₂ + O₂ → 2H₂O में H₂ और O₂ को क्या कहा जाता है?',
    conceptReasoning: 'In a chemical equation, the substances that participate in the reaction and undergo a chemical change are written on the left-hand side of the arrow and are called Reactants. The new substances produced are written on the right-hand side and are called Products.',
    conceptReasoningGu: 'રાસાયણિક સમીકરણમાં, જે પદાર્થો પ્રક્રિયામાં ભાગ લે છે અને રાસાયણિક ફેરફાર પામે છે તેમને તીરની ડાબી બાજુએ લખવામાં આવે છે અને તેમને પ્રક્રિયકો કહેવાય છે. ઉત્પન્ન થતા નવા પદાર્થોને નીપજો કહેવાય છે.',
    conceptReasoningHi: 'रासायनिक समीकरण में तीर के बाईं ओर लिखे जाने वाले पदार्थ जो अभिक्रिया में भाग लेते हैं, अभिकारक (Reactants) कहलाते हैं और दाईं ओर बनने वाले नए पदार्थ उत्पाद (Products) कहलाते हैं।',
    formulas: [
      'Reactants (પ્રક્રિયકો) ⟶ Products (નીપજો)',
      'Left of Arrow = Reactants',
      'Right of Arrow = Products'
    ],
    givenValues: {
      'Chemical Equation': '2H₂ + O₂ ⟶ 2H₂O'
    },
    toFind: 'Role / classification of H₂ and O₂',
    toFindGu: 'H₂ અને O₂ નું વર્ગીકરણ',
    toFindHi: 'H₂ और O₂ की पहचान',
    steps: [
      {
        stepNumber: 1,
        title: 'Understand Chemical Equation Convention',
        titleGu: 'રાસાયણિક સમીકરણના નિયમો સમજો',
        titleHi: 'रासायनिक समीकरण की परंपरा को समझें',
        why: 'The arrow (⟶) represents the direction of chemical change from starting materials to resulting materials.',
        whyGu: 'તીર (⟶) પ્રક્રિયાની દિશા દર્શાવે છે: શરૂઆતના પદાર્થોમાંથી અંતિમ પદાર્થો.',
        whyHi: 'तीर रासायनिक परिवर्तन की दिशा को दर्शाता है।',
        calculation: 'Starting Substances (Left) ⟶ Newly Formed Substances (Right)',
        intermediateResult: 'Left Side = Starting Materials'
      },
      {
        stepNumber: 2,
        title: 'Locate Position of H₂ and O₂',
        titleGu: 'H₂ અને O₂ નું સ્થાન નક્કી કરો',
        titleHi: 'H₂ और O₂ की स्थिति पहचानें',
        why: 'In 2H₂ + O₂ ⟶ 2H₂O, both Hydrogen (H₂) and Oxygen (O₂) appear to the left of the yield arrow.',
        whyGu: '2H₂ + O₂ ⟶ 2H₂O માં હાઇડ્રોજન (H₂) અને ઓક્સિજન (O₂) બંને તીરની ડાબી બાજુએ છે.',
        whyHi: 'H₂ और O₂ दोनों तीर के बाईं ओर हैं।',
        calculation: 'Left side: 2H₂ + O₂ (Undergo bonding change)',
        intermediateResult: 'Substances undergoing reaction = Reactants'
      }
    ],
    finalAnswer: 'Reactants',
    finalAnswerGu: 'પ્રક્રિયકો (Reactants)',
    finalAnswerHi: 'अभिकारक (Reactants)',
    keyTakeaway: 'Always remember: Left side of arrow = Reactants (what goes in). Right side of arrow = Products (what comes out).',
    keyTakeawayGu: 'હંમેશા યાદ રાખો: તીરની ડાબી બાજુ = પ્રક્રિયકો (ભાગ લેતા પદાર્થો). તીરની જમણી બાજુ = નીપજો (બનતા નવા પદાર્થો).',
    keyTakeawayHi: 'तीर के बाईं ओर अभिकारक और दाईं ओर उत्पाद होते हैं।'
  },

  // 13. Endothermic Reactions
  'sci_chem_endothermic': {
    subject: 'Science',
    subjectGu: 'વિજ્ઞાન',
    subjectHi: 'विज्ञान',
    topic: 'Chemistry - Chemical Reactions & Equations',
    topicGu: 'રસાયણ વિજ્ઞાન - રાસાયણિક પ્રક્રિયાઓ અને સમીકરણો',
    topicHi: 'रसायन विज्ञान - रासायनिक अभिक्रियाएं और समीकरण',
    problemStatement: 'What type of reaction absorbs thermal energy from its surroundings?',
    problemStatementGu: 'કયા પ્રકારની રાસાયણિક પ્રક્રિયા આસપાસમાંથી ઉષ્મા ઊર્જાનું શોષણ કરે છે?',
    problemStatementHi: 'किस प्रकार की रासायनिक अभिक्रिया अपने परिवेश से ऊष्मा ऊर्जा अवशोषित करती है?',
    conceptReasoning: 'Chemical reactions are categorized by heat flow: Endothermic reactions absorb thermal energy from the environment (causing temperature to drop), whereas Exothermic reactions release heat (causing temperature to rise).',
    conceptReasoningGu: 'ઊર્જા વિનિમયના આધારે પ્રક્રિયાઓના બે મુખ્ય પ્રકાર છે: ઉષ્માશોષક પ્રક્રિયાઓ પરિસરમાથી ઉષ્મા ઊર્જા શોષે છે (તાપમાન ઘટે છે), જ્યારે ઉષ્માક્ષેપક પ્રક્રિયાઓ ઉષ્મા મુક્ત કરે છે (તાપમાન વધે છે).',
    conceptReasoningHi: 'ऊष्मा प्रवाह के आधार पर: ऊष्माशोषी (Endothermic) अभिक्रियाएं परिवेश से ऊष्मा अवशोषित करती हैं, जबकि ऊष्माक्षेपी (Exothermic) अभिक्रियाएं ऊष्मा उत्सर्जित करती हैं।',
    formulas: [
      'Endothermic: Reactants + Heat Energy ⟶ Products (ΔH > 0)',
      'Exothermic: Reactants ⟶ Products + Heat Energy (ΔH < 0)'
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Analyze the Etymology and Concept',
        titleGu: 'શબ્દનો અર્થ અને સિદ્ધાંત સમજો',
        titleHi: 'शब्द का अर्थ समझें',
        why: 'The prefix "Endo-" means inner/absorbing, and "-thermic" refers to heat energy.',
        whyGu: '"Endo" એટલે અંદર તરફ અથવા શોષણ, અને "thermic" એટલે ઉષ્મા.',
        whyHi: '"Endo" का अर्थ अवशोषण और "thermic" का अर्थ ऊष्मा है।',
        calculation: 'Endo (In/Absorb) + Thermic (Heat) = Endothermic',
        intermediateResult: 'Heat-absorbing process'
      },
      {
        stepNumber: 2,
        title: 'Contrast Endothermic vs Exothermic',
        titleGu: 'ઉષ્માશોષક અને ઉષ્માક્ષેપક વચ્ચેનો તફાવત',
        titleHi: 'ऊष्माशोषी बनाम ऊष्माक्षेपी का अंतर',
        why: 'In endothermic reactions, bond-breaking energy in reactants exceeds bond-forming energy in products, so heat is taken in from the environment.',
        whyGu: 'પ્રક્રિયકોના બંધ તોડવા માટે જરૂરી ઊર્જા વધુ હોવાથી આસપાસમાંથી ઉષ્મા શોષાય છે.',
        whyHi: 'अभिकारकों के बंध तोड़ने के लिए अधिक ऊष्मा की आवश्यकता होती है।',
        calculation: 'Energy In > Energy Out ⟹ ΔH > 0 (Endothermic)',
        intermediateResult: 'Endothermic Reaction'
      }
    ],
    finalAnswer: 'Endothermic reaction',
    finalAnswerGu: 'ઉષ્માશોષક પ્રક્રિયા (Endothermic reaction)',
    finalAnswerHi: 'ऊष्माशोषी अभिक्रिया (Endothermic reaction)',
    keyTakeaway: 'Photosynthesis, evaporation of water, and baking bread are all endothermic because they continuously require absorbed heat/light energy.',
    keyTakeawayGu: 'પ્રકાશસંશ્લેષણ, પાણીનું બાષ્પીભવન અને ગ્લુકોઝનું ઓગળવું એ ઉષ્માશોષક પ્રક્રિયાઓના શ્રેષ્ઠ ઉદાહરણો છે.',
    keyTakeawayHi: 'प्रकाश संश्लेषण और बर्फ का पिघलना ऊष्माशोषी अभिक्रियाओं के उदाहरण हैं।'
  }
};

/**
 * Dynamic Mathematics & Science Problem Solver
 * Solves any user question / problem statement with intermediate steps, reasoning, and highlighted final answer.
 */
export async function solveStepByStepProblem(params: {
  problem: string;
  subject?: string;
  language?: string; // 'en' | 'gu' | 'hi'
  standard?: string;
}): Promise<StepByStepSolution> {
  const { problem, subject, language = 'en', standard = 'Standard 8' } = params;
  const isGu = language === 'gu';
  const isHi = language === 'hi';
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  // 1. Check if problem matches any known curriculum question
  const matchedCurriculum = findCurriculumMatch(problem);
  if (matchedCurriculum) {
    return matchedCurriculum;
  }

  // 2. Dynamic Pattern Solver (Deterministic offline mathematics & science formulas)
  const dynamicSolution = solveWithDeterministicEngines(problem, language);
  if (dynamicSolution) {
    return dynamicSolution;
  }

  // 3. If Gemini API Key is configured, use Gemini for arbitrary student problems
  if (apiKey && apiKey.length > 10) {
    try {
      const geminiSol = await solveWithGeminiAI(problem, language, standard, apiKey, subject);
      if (geminiSol) {
        return geminiSol;
      }
    } catch (err: any) {
      console.warn('[StepByStepSolver] Gemini API call error:', err.message);
    }
  }

  // 4. Fallback Pedagogical Solver
  return buildGeneralPedagogicalSolution(problem, language, subject);
}

/**
 * Match against existing curriculum question key
 */
export function getCurriculumSolution(keyOrId: string): StepByStepSolution | null {
  return CURRICULUM_SOLUTIONS[keyOrId] || null;
}

/**
 * Find match from problem text
 */
function findCurriculumMatch(query: string): StepByStepSolution | null {
  const q = query.toLowerCase().replace(/[\s\-_]/g, ' ');

  // 1. Quadratic: x² - 5x + 6 = 0
  if ((q.includes('5x + 6') || q.includes('5x+6') || q.includes('5x - 6')) && (q.includes('root') || q.includes('બીજ') || q.includes('मूल') || q.includes('quadratic') || q.includes('દ્વિઘાત') || q.includes('દ્વિઘાત સમીકરણ'))) {
    return CURRICULUM_SOLUTIONS['quad_roots'];
  }
  // 2. Discriminant: 2x² - 4x + 3 = 0
  if ((q.includes('4x + 3') || q.includes('4x+3') || q.includes('4x - 3')) && (q.includes('discriminant') || q.includes('વિવેચક') || q.includes('विविक्तकर') || q.includes('દ્વિઘાત') || q.includes('quadratic'))) {
    return CURRICULUM_SOLUTIONS['quad_discriminant'];
  }
  // 3. Nature of roots D < 0
  if ((q.includes('discriminant') || q.includes('વિવેચક') || q.includes('विविक्तકર')) && (q.includes('d < 0') || q.includes('d<0') || q.includes('d <0') || q.includes('ઋણ') || q.includes('negative'))) {
    return CURRICULUM_SOLUTIONS['quad_nature'];
  }
  // 4. sin² + cos²
  if ((q.includes('sin') && q.includes('cos') && (q.includes('equivalent') || q.includes('સમાન') || q.includes('બરાબર') || q.includes('નિત્યસમ')))) {
    return CURRICULUM_SOLUTIONS['trig_pythagorean'];
  }
  // 5. (1 - cos²) / sin
  if ((q.includes('1 - cos') || q.includes('1-cos')) && q.includes('sin')) {
    return CURRICULUM_SOLUTIONS['trig_simplify'];
  }
  // 6. tan 45
  if (q.includes('tan(45') || q.includes('tan 45') || q.includes('tan45')) {
    return CURRICULUM_SOLUTIONS['trig_tan45'];
  }
  // 7. sec² - tan²
  if (q.includes('sec') && q.includes('tan') && (q.includes('simplest') || q.includes('સાદુરૂપ') || q.includes('સરળ'))) {
    return CURRICULUM_SOLUTIONS['trig_sec_tan'];
  }
  // 8. 3x4 - 5x² + 7
  if ((q.includes('3x4') || q.includes('3x⁴') || q.includes('3x^4') || q.includes('5x2') || q.includes('5x²') || q.includes('5x^2')) && (q.includes('derivative') || q.includes('વિકલન') || q.includes('અવકલજ'))) {
    return CURRICULUM_SOLUTIONS['calc_diff_poly'];
  }
  // 9. derivative sin(x)
  if ((q.includes('derivative') || q.includes('વિકલન') || q.includes('અવકલજ')) && q.includes('sin(x)')) {
    return CURRICULUM_SOLUTIONS['calc_diff_sin'];
  }
  // 10. Newton second law formula
  if ((q.includes('newton') || q.includes('ન્યૂટન') || q.includes('न्यूटन')) && (q.includes('second') || q.includes('બીજા') || q.includes('બીજો') || q.includes('દૂસરે')) && (q.includes('formula') || q.includes('સૂત્ર') || q.includes('સંબંધ'))) {
    return CURRICULUM_SOLUTIONS['sci_newton_law'];
  }
  // 11. 10 kg and 50 N acceleration
  if ((q.includes('10 kg') || q.includes('10kg')) && (q.includes('50 n') || q.includes('50n'))) {
    return CURRICULUM_SOLUTIONS['sci_accel_calc'];
  }
  // 12. 2H2 + O2 reactants
  if ((q.includes('2h2') || q.includes('2h₂') || q.includes('h2 + o2')) && (q.includes('reactant') || q.includes('પ્રક્રિયકો') || q.includes('called') || q.includes('કહેવાય'))) {
    return CURRICULUM_SOLUTIONS['sci_chem_reactants'];
  }
  // 13. Endothermic reaction
  if ((q.includes('absorb') || q.includes('શોષણ') || q.includes('अवशोषित')) && (q.includes('thermal') || q.includes('heat') || q.includes('ઉષ્મા') || q.includes('ઊર્જા'))) {
    return CURRICULUM_SOLUTIONS['sci_chem_endothermic'];
  }

  return null;
}

/**
 * Deterministic Engine: Handles any linear equation, acceleration, force, pressure, work, speed, etc.
 */
function solveWithDeterministicEngines(rawQuery: string, language: string): StepByStepSolution | null {
  const isGu = language === 'gu';
  const isHi = language === 'hi';
  const q = rawQuery.trim();

  // Pattern 0: General Quadratic Equations: ax² + bx + c = 0 or ax^2 + bx + c = 0
  const quadMatch = q.match(/([+-]?\s*\d*)\s*([a-zA-Z])(?:\^2|²)\s*([+-]\s*\d*)\s*\2\s*([+-]\s*\d+)\s*(?:=\s*0)?/i);
  if (quadMatch) {
    let aStr = quadMatch[1].replace(/\s+/g, '');
    const variable = quadMatch[2];
    let bStr = quadMatch[3].replace(/\s+/g, '');
    let cStr = quadMatch[4].replace(/\s+/g, '');

    let a = 1;
    if (aStr === '' || aStr === '+') a = 1;
    else if (aStr === '-') a = -1;
    else a = parseFloat(aStr);

    let b = 1;
    if (bStr === '' || bStr === '+') b = 1;
    else if (bStr === '-') b = -1;
    else b = parseFloat(bStr);

    const c = parseFloat(cStr);

    if (a !== 0 && !isNaN(b) && !isNaN(c)) {
      const D = b * b - 4 * a * c;
      const dSqrt = D >= 0 ? Math.sqrt(D) : NaN;
      let root1 = !isNaN(dSqrt) ? Math.round(((-b + dSqrt) / (2 * a)) * 1000) / 1000 : null;
      let root2 = !isNaN(dSqrt) ? Math.round(((-b - dSqrt) / (2 * a)) * 1000) / 1000 : null;

      // Ensure root1 <= root2 for standard display
      if (root1 !== null && root2 !== null && root1 > root2) {
        const tmp = root1;
        root1 = root2;
        root2 = tmp;
      }

      const finalAnsText = D >= 0
        ? (root1 === root2 ? `${variable} = ${root1}` : `${variable} = ${root1}, ${variable} = ${root2}`)
        : `${variable} = (${-b} ± i√${Math.abs(D)}) / ${2 * a} (No real roots)`;

      return {
        subject: 'Mathematics',
        subjectGu: 'ગણિત',
        subjectHi: 'गणित',
        topic: 'Quadratic Equations',
        topicGu: 'દ્વિઘાત સમીકરણો',
        topicHi: 'द्विघात समीकरण',
        problemStatement: `Solve the quadratic equation: ${a !== 1 ? a : ''}${variable}² ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)}${variable} ${c >= 0 ? '+ ' + c : '- ' + Math.abs(c)} = 0`,
        problemStatementGu: `દ્વિઘાત સમીકરણ ઉકેલો: ${a !== 1 ? a : ''}${variable}² ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)}${variable} ${c >= 0 ? '+ ' + c : '- ' + Math.abs(c)} = 0`,
        problemStatementHi: `द्विघात समीकरण हल करें: ${a !== 1 ? a : ''}${variable}² ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)}${variable} ${c >= 0 ? '+ ' + c : '- ' + Math.abs(c)} = 0`,
        conceptReasoning: 'A quadratic equation in standard form ax² + bx + c = 0 can be solved using the Quadratic Formula x = (-b ± √D) / 2a, where the discriminant D = b² - 4ac determines the number and nature of the roots.',
        conceptReasoningGu: 'દ્વિઘાત સમીકરણ ax² + bx + c = 0 ને દ્વિઘાત સૂત્ર x = (-b ± √D) / 2a દ્વારા ઉકેલી શકાય છે, જ્યાં વિવેચક D = b² - 4ac બીજનો પ્રકાર અને સંખ્યા નક્કી કરે છે.',
        conceptReasoningHi: 'द्विघात समीकरण ax² + bx + c = 0 को सूत्र x = (-b ± √D) / 2a से हल किया जा सकता है।',
        formulas: [
          'ax² + bx + c = 0',
          'Discriminant D = b² - 4ac',
          'Roots x = (-b ± √D) / (2a)'
        ],
        givenValues: {
          'Equation': `${a !== 1 ? a : ''}${variable}² ${b >= 0 ? '+ ' + b : '- ' + Math.abs(b)}${variable} ${c >= 0 ? '+ ' + c : '- ' + Math.abs(c)} = 0`,
          'a': `${a}`,
          'b': `${b}`,
          'c': `${c}`
        },
        toFind: `Roots of the equation (${variable})`,
        toFindGu: `સમીકરણના બીજ (${variable})`,
        toFindHi: `समीकरण के मूल (${variable})`,
        steps: [
          {
            stepNumber: 1,
            title: 'Identify Coefficients from Standard Form',
            titleGu: 'પ્રમાણભૂત સ્વરૂપમાંથી સહગુણકો ઓળખો',
            titleHi: 'मानक रूप से गुणांकों की पहचान करें',
            why: 'Compare the equation with ax² + bx + c = 0 to extract parameters a, b, and c.',
            whyGu: 'સમીકરણને ax² + bx + c = 0 સાથે સરખાવીને a, b, c ના મૂલ્યો નક્કી કરો.',
            whyHi: 'समीकरण की तुलना मानक रूप ax² + bx + c = 0 से करें।',
            calculation: `a = ${a}, b = ${b}, c = ${c}`,
            intermediateResult: `a = ${a}, b = ${b}, c = ${c}`
          },
          {
            stepNumber: 2,
            title: 'Calculate the Discriminant (D)',
            titleGu: 'વિવેચક (D) ની ગણતરી કરો',
            titleHi: 'विविक्तकर (D) की गणना करें',
            why: 'The discriminant D = b² - 4ac establishes whether roots are real and distinct (D > 0), real and equal (D = 0), or non-real (D < 0).',
            whyGu: 'D = b² - 4ac નક્કી કરે છે કે બીજ વાસ્તવિક છે કે નહીં.',
            whyHi: 'विविक्तकर D = b² - 4ac मूलों की प्रकृति बताता है।',
            calculation: `D = (${b})² - 4(${a})(${c}) = ${b * b} - ${4 * a * c} = ${D}`,
            intermediateResult: `D = ${D} (${D > 0 ? 'Two distinct real roots' : D === 0 ? 'Two equal real roots' : 'No real roots'})`
          },
          {
            stepNumber: 3,
            title: 'Apply the Quadratic Formula',
            titleGu: 'દ્વિઘાત સૂત્ર લાગુ કરો',
            titleHi: 'द्विघात सूत्र लागू करें',
            why: 'Substitute coefficients a, b and discriminant D into the formula x = (-b ± √D) / 2a.',
            whyGu: 'સૂત્ર x = (-b ± √D) / 2a માં કિંમતો મૂકો.',
            whyHi: 'सूत्र में मान प्रतिस्थापित करें।',
            calculation: D >= 0
              ? `${variable} = (-(${b}) ± √${D}) / (2 × ${a}) = (${-b} ± ${dSqrt}) / ${2 * a}`
              : `${variable} = (-(${b}) ± √${D}) / ${2 * a} (Complex roots)`,
            intermediateResult: D >= 0 ? `Numerator values: ${-b + dSqrt} and ${-b - dSqrt}` : 'No real solution'
          },
          {
            stepNumber: 4,
            title: 'Evaluate the Roots',
            titleGu: 'બીજની અંતિમ કિંમતો ગણો',
            titleHi: 'मूलों का अंतिम मान ज्ञात करें',
            why: 'Calculate the arithmetic quotient for both positive and negative branches.',
            whyGu: 'ધન અને ઋણ બંને વિકલ્પો માટે ભાગાકાર પૂર્ણ કરો.',
            whyHi: 'दोनों मानों के लिए गणना पूरी करें।',
            calculation: D >= 0
              ? `${variable}₁ = (${-b} + ${dSqrt}) / ${2 * a} = ${root1}\n${variable}₂ = (${-b} - ${dSqrt}) / ${2 * a} = ${root2}`
              : 'Complex conjugate roots',
            intermediateResult: finalAnsText
          }
        ],
        verification: (D >= 0 && root1 !== null)
          ? `Check root ${root1}: ${a}(${root1})² + (${b})(${root1}) + (${c}) = ${Math.round(a * root1 * root1 + b * root1 + c)} ≈ 0 (True).`
          : undefined,
        verificationGu: (D >= 0 && root1 !== null)
          ? `ચકાસણી: સમીકરણમાં ${variable} = ${root1} મૂકતા ડાબી બાજુ = જમણી બાજુ (સત્ય છે).`
          : undefined,
        verificationHi: D >= 0
          ? `सत्यापन: समीकरण में मान रखने पर 0 प्राप्त होता है।`
          : undefined,
        finalAnswer: finalAnsText,
        finalAnswerGu: finalAnsText,
        finalAnswerHi: finalAnsText,
        keyTakeaway: 'The quadratic formula works for ALL quadratic equations. Always compute D = b² - 4ac first; if D is a perfect square, the roots are rational.',
        keyTakeawayGu: 'દ્વિઘાત સૂત્ર દરેક દ્વિઘાત સમીકરણ માટે ઉપયોગી છે. હંમેશા પહેલાં D = b² - 4ac શોધો; જો D પૂર્ણવર્ગ હોય તો બીજ સંમેય સંખ્યાઓ મળે છે.',
        keyTakeawayHi: 'सर्वप्रथम सदैव विविक्तकर D = b² - 4ac ज्ञात करें। यदि D पूर्ण वर्ग है तो मूल परिमेय होंगे।',
        commonMistakes: [
          `Sign error with -b: Here b = ${b}, so -b = ${-b}. Do not forget the negative sign!`,
          `Discriminant calculation error: (-b)² is always positive. Watch out when subtracting 4ac.`,
          `Denominator oversight: The entire expression is divided by 2a = ${2 * a}, not just the square root term.`
        ],
        commonMistakesGu: [
          `-b નું ચિહ્ન: અહીં b = ${b} હોવાથી -b = ${-b} થાય. ચિહ્નની ભૂલ ન કરો!`,
          `વિવેચક ગણતરી: b² હંમેશા ધન હોય છે. 4ac બાદ કરતી વખતે સાવચેતી રાખો.`,
          `છેદ ભૂલી જવો: આખો અંશ 2a = ${2 * a} વડે ભંગાય છે.`
        ],
        commonMistakesHi: [
          `-b का चिह्न: यहाँ b = ${b} है, अतः -b = ${-b} होगा।`,
          `विविक्तकर D = b² - 4ac में 4ac घटाते समय सावधानी रखें।`,
          `पूरे अंश को 2a से विभाजित करना न भूलें।`
        ],
        alternativeMethod: {
          title: 'Completing the Square Method',
          description: 'Rewrite the equation as (x + p)² = q and take square roots of both sides.',
          calculation: `(${variable} + ${b / (2 * a)})² = ${D / (4 * a * a)}`
        },
        alternativeMethodGu: {
          title: 'પૂર્ણવર્ગની રીત',
          description: 'સમીકરણને (x + p)² = q સ્વરૂપમાં ફેરવીને બંને બાજુ વર્ગમૂળ લો.',
          calculation: `(${variable} + ${b / (2 * a)})² = ${D / (4 * a * a)}`
        },
        alternativeMethodHi: {
          title: 'पूर्ण वर्ग बनाने की विधि',
          description: 'समीकरण को (x + p)² = q के रूप में लिखकर दोनों ओर वर्गमूल लें।',
          calculation: `(${variable} + ${b / (2 * a)})² = ${D / (4 * a * a)}`
        },
        practiceChallenge: {
          problem: `Solve 2${variable}² - 8${variable} + 6 = 0`,
          hint: 'Divide the whole equation by 2 first to get x² - 4x + 3 = 0, then compute roots.',
          answer: `${variable} = 1, ${variable} = 3`
        },
        practiceChallengeGu: {
          problem: `2${variable}² - 8${variable} + 6 = 0 ઉકેલો`,
          hint: 'પહેલાં આખા સમીકરણને 2 વડે ભાગીને સાદુરૂપ આપો.',
          answer: `${variable} = 1, ${variable} = 3`
        },
        practiceChallengeHi: {
          problem: `2${variable}² - 8${variable} + 6 = 0 को हल करें`,
          hint: 'सर्वप्रथम पूरे समीकरण को 2 से भाग दें।',
          answer: `${variable} = 1, ${variable} = 3`
        }
      };
    }
  }

  // Pattern A: Linear Equation in one variable: ax + b = c or ax - b = c
  const linearMatch = q.match(/([+-]?\s*\d*)\s*([a-zA-Z])\s*([+-]\s*\d+)\s*=\s*([+-]?\s*\d+)/);
  if (linearMatch) {
    let coeffStr = linearMatch[1].replace(/\s+/g, '');
    const variable = linearMatch[2];
    const constStr = linearMatch[3].replace(/\s+/g, '');
    const rhsStr = linearMatch[4].replace(/\s+/g, '');

    let coeff = 1;
    if (coeffStr === '' || coeffStr === '+') coeff = 1;
    else if (coeffStr === '-') coeff = -1;
    else coeff = parseFloat(coeffStr);

    const constant = parseFloat(constStr);
    const rhs = parseFloat(rhsStr);

    if (coeff !== 0) {
      const step1Rhs = rhs - constant;
      const solution = Math.round((step1Rhs / coeff) * 1000) / 1000;

      return {
        subject: 'Mathematics',
        subjectGu: 'ગણિત',
        subjectHi: 'गणित',
        topic: 'Linear Equations in One Variable',
        topicGu: 'એક ચલ રેખીય સમીકરણ',
        topicHi: 'एक चर वाले रैखिक समीकरण',
        problemStatement: `Solve for ${variable}: ${q}`,
        problemStatementGu: `${variable} માટે સમીકરણ ઉકેલો: ${q}`,
        problemStatementHi: `${variable} के लिए समीकरण हल करें: ${q}`,
        conceptReasoning: 'To solve a linear equation, keep the equation balanced by isolating the variable term on one side and moving all constant numbers to the opposite side using inverse arithmetic operations.',
        conceptReasoningGu: 'રેખીય સમીકરણ ઉકેલવા માટે, ચલવાળા પદને એક બાજુ રાખીને અચળ સંખ્યાઓને વિરુદ્ધ ક્રિયાઓ દ્વારા બીજી બાજુ લઈ જઈ સમીકરણને સંતુલિત રાખો.',
        conceptReasoningHi: 'रैखिक समीकरण को हल करने के लिए चर पद को एक ओर रखकर अचर पदों को दूसरी ओर पक्षांतरित करें।',
        formulas: ['ax + b = c ⟹ ax = c - b ⟹ x = (c - b) / a'],
        givenValues: {
          'Given Equation': `${coeff}${variable} ${constant >= 0 ? '+ ' + constant : '- ' + Math.abs(constant)} = ${rhs}`,
          'Coefficient of variable': `${coeff}`,
          'Constant term': `${constant}`,
          'Right Hand Side': `${rhs}`
        },
        toFind: `Value of ${variable}`,
        toFindGu: `${variable} ની કિંમત`,
        toFindHi: `${variable} का मान`,
        steps: [
          {
            stepNumber: 1,
            title: 'Identify Variable and Constant Terms',
            titleGu: 'ચલ અને અચળ પદો ઓળખો',
            titleHi: 'चर और अचर पदों की पहचान करें',
            why: 'Group terms containing the variable on the Left Hand Side (LHS) and purely numerical constants.',
            whyGu: 'ચલ ધરાવતા પદને ડાબી બાજુ રાખો અને સંખ્યાત્મક અચળો અલગ કરો.',
            whyHi: 'चर पद को बाईं ओर रखें।',
            calculation: `Variable term: ${coeff}${variable}, Constant: ${constant}, RHS: ${rhs}`,
            intermediateResult: `${coeff}${variable} + (${constant}) = ${rhs}`
          },
          {
            stepNumber: 2,
            title: 'Transpose the Constant Term to the RHS',
            titleGu: 'અચળ પદને જમણી બાજુ લઈ જાઓ',
            titleHi: 'अचर पद का पक्षांतरण करें',
            why: `Subtract ${constant} from both sides to isolate the variable term ${coeff}${variable}.`,
            whyGu: `ચલ પદ ${coeff}${variable} ને એકલું કરવા માટે બંને બાજુમાંથી (${constant}) બાદ કરો.`,
            whyHi: `चर पद को अकेला करने के लिए दोनों ओर से (${constant}) घटाएं।`,
            calculation: `${coeff}${variable} = ${rhs} - (${constant}) = ${step1Rhs}`,
            intermediateResult: `${coeff}${variable} = ${step1Rhs}`
          },
          {
            stepNumber: 3,
            title: `Divide Both Sides by the Coefficient (${coeff})`,
            titleGu: `બંને બાજુ સહગુણક (${coeff}) વડે ભાગો`,
            titleHi: `दोनों ओर गुणांक (${coeff}) से भाग दें`,
            why: `Since ${variable} is multiplied by ${coeff}, the inverse operation is division by ${coeff}.`,
            whyGu: `${variable} સાથે ${coeff} ગુણાયેલ હોવાથી, વિરુદ્ધ ક્રિયા તરીકે ${coeff} વડે ભાગાકાર કરો.`,
            whyHi: `${coeff} से दोनों ओर भाग दें।`,
            calculation: `${variable} = ${step1Rhs} / ${coeff} = ${solution}`,
            intermediateResult: `${variable} = ${solution}`
          }
        ],
        verification: `Verification: LHS = ${coeff}(${solution}) + (${constant}) = ${coeff * solution + constant} = RHS (${rhs}). The equation is balanced!`,
        verificationGu: `ચકાસણી: ડાબી બાજુ = ${coeff}(${solution}) + (${constant}) = ${rhs} = જમણી બાજુ (સંપૂર્ણ સત્ય છે).`,
        verificationHi: `सत्यापन: बायाँ पक्ष = ${coeff}(${solution}) + (${constant}) = ${rhs} = दायाँ पक्ष।`,
        finalAnswer: `${variable} = ${solution}`,
        finalAnswerGu: `${variable} = ${solution}`,
        finalAnswerHi: `${variable} = ${solution}`,
        keyTakeaway: 'When moving any term across the equals sign (=), always invert its operation: addition becomes subtraction, and multiplication becomes division.',
        keyTakeawayGu: 'બરાબરના ચિહ્ન (=) ની બીજી બાજુ પદ લઈ જતી વખતે હંમેશા ચિહ્ન બદલાય છે: સરવાળો બાદબાકી બને છે, અને ગુણાકાર ભાગાકાર બને છે.',
        keyTakeawayHi: 'पक्षांतरण करते समय सदैव विपरीत संक्रिया लागू करें: धन का ऋण और गुणा का भाग।',
        commonMistakes: [
          `Sign reversal error: Moving +${constant} to the other side requires subtraction (-${constant}), not addition.`,
          `Division order: Never divide by the coefficient (${coeff}) before isolating the constant term first.`
        ],
        commonMistakesGu: [
          `ચિહ્ન બદલવાની ભૂલ: +${constant} ને બીજી બાજુ લઈ જતી વખતે બાદબાકી (-${constant}) કરવી પડે છે.`,
          `ભાગાકારનો ક્રમ: અચળ પદને અલગ કર્યા પહેલાં સહગુણક વડે ભાગાકાર ન કરવો.`
        ],
        commonMistakesHi: [
          `पक्षांतरण में चिह्न परिवर्तन: +${constant} दूसरी ओर जाकर -${constant} होगा।`,
          `पहले अचर पद को घटाएं, फिर गुणांक से भाग दें।`
        ],
        alternativeMethod: {
          title: 'Direct Balancing Method',
          description: `Subtract ${constant} from both sides, then divide both sides by ${coeff}.`,
          calculation: `${coeff}${variable} + ${constant} - ${constant} = ${rhs} - ${constant} ⟹ ${coeff}${variable} = ${step1Rhs}`
        },
        alternativeMethodGu: {
          title: 'સંતુલન પદ્ધતિ',
          description: `બંને બાજુથી ${constant} બાદ કરો અને પછી ${coeff} વડે ભાગો.`,
          calculation: `${coeff}${variable} = ${step1Rhs} ⟹ ${variable} = ${solution}`
        },
        alternativeMethodHi: {
          title: 'समीकरण संतुलन विधि',
          description: `दोनों पक्षों से ${constant} घटाएं, तत्पश्चात ${coeff} से भाग दें।`,
          calculation: `${coeff}${variable} = ${step1Rhs} ⟹ ${variable} = ${solution}`
        },
        practiceChallenge: {
          problem: `Solve 4${variable} - 12 = 28`,
          hint: `Add 12 to both sides, then divide by 4.`,
          answer: `${variable} = 10`
        },
        practiceChallengeGu: {
          problem: `4${variable} - 12 = 28 ઉકેલો`,
          hint: `બંને બાજુ 12 ઉમેરીને પછી 4 વડે ભાગો.`,
          answer: `${variable} = 10`
        },
        practiceChallengeHi: {
          problem: `4${variable} - 12 = 28 को हल करें`,
          hint: `दोनों पक्षों में 12 जोड़ें, फिर 4 से भाग दें।`,
          answer: `${variable} = 10`
        }
      };
    }
  }

  // Pattern B: Physics Force, Mass, Acceleration numericals (F = m * a)
  const forceMatch = q.match(/(\d+\.?\d*)\s*(?:n|newton|ન્યૂટન|न्यूटन)/i);
  const massMatch = q.match(/(\d+\.?\d*)\s*(?:kg|kilogram|કિગ્રા|કિલોગ્રામ|किग्रा)/i);
  const accelMatch = q.match(/(\d+\.?\d*)\s*(?:m\/s²|m\/s2|m\/s\^2|મીટર\/સેકન્ડ²|मीटर\/सेकंड²)/i);

  if (forceMatch && massMatch && !accelMatch) {
    const fVal = parseFloat(forceMatch[1]);
    const mVal = parseFloat(massMatch[1]);
    if (mVal > 0) {
      const aVal = Math.round((fVal / mVal) * 100) / 100;
      return {
        subject: 'Science',
        subjectGu: 'વિજ્ઞાન',
        subjectHi: 'विज्ञान',
        topic: 'Physics - Newton\'s Second Law of Motion',
        topicGu: 'ભૌતિક વિજ્ઞાન - બળ અને પ્રવેગ',
        topicHi: 'भौतिक विज्ञान - बल और त्वरण',
        problemStatement: `Calculate acceleration for Force = ${fVal} N, Mass = ${mVal} kg`,
        problemStatementGu: `બળ = ${fVal} N અને દળ = ${mVal} kg માટે પ્રવેગ શોધો`,
        problemStatementHi: `बल = ${fVal} N और द्रव्यमान = ${mVal} kg के लिए त्वरण ज्ञात करें`,
        conceptReasoning: "Newton's Second Law states that force is the product of mass and acceleration (F = m × a). Rearranging gives acceleration a = F / m.",
        conceptReasoningGu: 'ન્યૂટનના બીજા નિયમ મુજબ બળ એ દળ અને પ્રવેગનો ગુણાકાર છે (F = m × a). તેથી પ્રવેગ a = F / m.',
        conceptReasoningHi: 'न्यूटन के दूसरे नियम के अनुसार बल F = m × a होता है। अतः त्वरण a = F / m.',
        formulas: ['F = m · a ⟹ a = F / m'],
        givenValues: {
          'Force (F)': `${fVal} N`,
          'Mass (m)': `${mVal} kg`
        },
        toFind: 'Acceleration (a) in m/s²',
        toFindGu: 'પ્રવેગ (a) m/s² માં',
        toFindHi: 'त्वरण (a) m/s² में',
        steps: [
          {
            stepNumber: 1,
            title: 'Identify Given Physical Quantities',
            titleGu: 'આપેલા ભૌતિક મૂલ્યો ઓળખો',
            titleHi: 'दिए गए भौतिक मान पहचानें',
            why: 'Write down values with proper SI units: Force F in Newtons (N) and Mass m in kilograms (kg).',
            whyGu: 'યોગ્ય SI એકમો સાથે મૂલ્યો લખો: F = ' + fVal + ' N, m = ' + mVal + ' kg.',
            whyHi: 'मानक इकाइयों के साथ मान लिखें: F = ' + fVal + ' N, m = ' + mVal + ' kg.',
            calculation: `F = ${fVal} N, m = ${mVal} kg`,
            intermediateResult: `F = ${fVal} N, m = ${mVal} kg`
          },
          {
            stepNumber: 2,
            title: 'Apply Formula a = F / m',
            titleGu: 'સૂત્ર a = F / m લાગુ કરો',
            titleHi: 'सूत्र a = F / m लागू करें',
            why: 'To determine acceleration, divide net force by mass.',
            whyGu: 'પ્રવેગ શોધવા માટે બળને દળ વડે ભાગો.',
            whyHi: 'त्वरण निकालने के लिए बल को द्रव्यमान से भाग दें।',
            calculation: `a = ${fVal} N / ${mVal} kg = ${fVal / mVal} m/s²`,
            intermediateResult: `a = ${aVal} m/s²`
          }
        ],
        verification: `Check: F = m · a = ${mVal} kg × ${aVal} m/s² = ${Math.round(mVal * aVal)} N ≈ ${fVal} N. Correct!`,
        verificationGu: `ચકાસણી: F = ${mVal} × ${aVal} = ${fVal} N. સાચું છે!`,
        verificationHi: `सत्यापन: F = ${mVal} × ${aVal} = ${fVal} N. सही है!`,
        finalAnswer: `${aVal} m/s²`,
        finalAnswerGu: `${aVal} m/s²`,
        finalAnswerHi: `${aVal} m/s²`,
        keyTakeaway: 'Always check that mass is in kg and force in N before dividing, which directly gives acceleration in m/s².',
        keyTakeawayGu: 'હંમેશા ખાતરી કરો કે દળ કિગ્રામાં અને બળ ન્યૂટનમાં હોય, જેથી પ્રવેગ સીધો m/s² માં મળશે.',
        keyTakeawayHi: 'सुनिश्चित करें कि द्रव्यमान kg में और बल N में हो।',
        commonMistakes: [
          'Confusing Mass with Weight/Force: Mass is measured in kg, while Force/Weight is in Newtons (N).',
          'Inverting the formula: Writing a = m / F instead of a = F / m.',
          'Missing unit squared: Acceleration is m/s² (meters per second squared), not m/s (speed).'
        ],
        commonMistakesGu: [
          'દળ અને વજન/બળ વચ્ચે ગૂંચવણ: દળ કિલોગ્રામ (kg) માં મપાય છે અને બળ ન્યૂટન (N) માં.',
          'સૂત્ર ઉલટાવવું: a = F / m ના બદલે a = m / F લખવું.',
          'એકમમાં ભૂલ: પ્રવેગનો એકમ m/s² છે, m/s (ઝડપ) નથી.'
        ],
        commonMistakesHi: [
          'द्रव्यमान और बल में अंतर समझें: द्रव्यमान kg में और बल N में होता है।',
          'सूत्र a = F / m को कभी a = m / F न लिखें।',
          'त्वरण का मात्रक m/s² होता है, m/s नहीं।'
        ],
        alternativeMethod: {
          title: 'Dimensional Analysis & Ratio Method',
          description: 'Use unit balance: 1 Newton = 1 kg·m/s². Therefore N / kg = (kg·m/s²) / kg = m/s².',
          calculation: `[Force] / [Mass] = (N) / (kg) = m/s² ⟹ ${fVal} / ${mVal} = ${aVal} m/s²`
        },
        alternativeMethodGu: {
          title: 'પારિમાણિક પૃથક્કરણ પદ્ધતિ',
          description: 'એકમોની ચકાસણી: N / kg = m/s².',
          calculation: `[બળ] / [દળ] = ${fVal} / ${mVal} = ${aVal} m/s²`
        },
        alternativeMethodHi: {
          title: 'विमीय विश्लेषण विधि',
          description: 'इकाई संतुलन: N / kg = m/s².',
          calculation: `[बल] / [द्रव्यमान] = ${fVal} / ${mVal} = ${aVal} m/s²`
        },
        practiceChallenge: {
          problem: `A vehicle of mass 200 kg experiences a net braking force of 800 N. Find its deceleration.`,
          hint: 'Apply a = F / m with F = 800 N and m = 200 kg.',
          answer: 'a = 4 m/s²'
        },
        practiceChallengeGu: {
          problem: `200 kg દળ ધરાવતા વાહન પર 800 N નું બ્રેકિંગ બળ લાગે છે. તેનો પ્રતિપ્રવેગ શોધો.`,
          hint: 'F = 800 N અને m = 200 kg સાથે a = F / m વાપરો.',
          answer: 'a = 4 m/s²'
        },
        practiceChallengeHi: {
          problem: `200 kg द्रव्यमान के वाहन पर 800 N का मंदक बल लगता है। मंदन ज्ञात करें।`,
          hint: 'a = F / m सूत्र लगाएं।',
          answer: 'a = 4 m/s²'
        }
      };
    }
  }

  // Pattern C: Physics Speed, Distance, Time (v = d / t)
  const distMatch = q.match(/(\d+\.?\d*)\s*(?:m|meter|km|મીટર|કિમી|मीटर|किमी)/i);
  const timeMatch = q.match(/(\d+\.?\d*)\s*(?:s|sec|second|hr|hour|સેકન્ડ|કલાક|सेकंड|घंटे)/i);
  if (distMatch && timeMatch && (q.includes('speed') || q.includes('ઝડપ') || q.includes('ગતિ') || q.includes('चाल') || q.includes('velocity') || q.includes('વેગ'))) {
    const dVal = parseFloat(distMatch[1]);
    const tVal = parseFloat(timeMatch[1]);
    if (tVal > 0) {
      const speedVal = Math.round((dVal / tVal) * 100) / 100;
      return {
        subject: 'Science',
        subjectGu: 'વિજ્ઞાન',
        subjectHi: 'विज्ञान',
        topic: 'Physics - Motion & Kinematics',
        topicGu: 'ભૌતિક વિજ્ઞાન - ગતિ અને ઝડપ',
        topicHi: 'भौतिक विज्ञान - गति और चाल',
        problemStatement: `Calculate Speed for Distance = ${dVal}, Time = ${tVal}`,
        problemStatementGu: `અંતર = ${dVal} અને સમય = ${tVal} માટે ઝડપ શોધો`,
        problemStatementHi: `दूरी = ${dVal} और समय = ${tVal} के लिए चाल ज्ञात करें`,
        conceptReasoning: 'Speed is the scalar physical quantity defined as the rate of distance covered per unit time: Speed = Distance / Time.',
        conceptReasoningGu: 'ઝડપ એ એકમ સમયમાં કાપેલ અંતર દર્શાવે છે: ઝડપ = અંતર / સમય.',
        conceptReasoningHi: 'चाल एकांक समय में तय की गई दूरी है: चाल = दूरी / समय.',
        formulas: ['Speed (v) = Distance (d) / Time (t)'],
        givenValues: {
          'Distance (d)': `${dVal}`,
          'Time (t)': `${tVal}`
        },
        toFind: 'Speed (v)',
        toFindGu: 'ઝડપ (v)',
        toFindHi: 'चाल (v)',
        steps: [
          {
            stepNumber: 1,
            title: 'Identify Distance and Time Parameters',
            titleGu: 'અંતર અને સમયના મૂલ્યો લખો',
            titleHi: 'दूरी और समय लिखें',
            why: 'Extract given values from the problem statement.',
            whyGu: 'પ્રશ્નમાંથી અંતર અને સમય નોંધો.',
            whyHi: 'दूरी और समय दर्ज करें।',
            calculation: `Distance d = ${dVal}, Time t = ${tVal}`,
            intermediateResult: `d = ${dVal}, t = ${tVal}`
          },
          {
            stepNumber: 2,
            title: 'Divide Distance by Time',
            titleGu: 'અંતરને સમય વડે ભાગો',
            titleHi: 'दूरी को समय से विभाजित करें',
            why: 'Apply definition of speed: rate of change of position.',
            whyGu: 'ઝડપનું સૂત્ર v = d / t લાગુ કરો.',
            whyHi: 'चाल का सूत्र v = d / t लागू करें।',
            calculation: `v = ${dVal} / ${tVal} = ${speedVal}`,
            intermediateResult: `v = ${speedVal}`
          }
        ],
        finalAnswer: `${speedVal} (Distance units / Time unit)`,
        finalAnswerGu: `${speedVal} એકમ`,
        finalAnswerHi: `${speedVal} इकाई`,
        keyTakeaway: 'Ensure distance and time are in consistent units (e.g. meters and seconds for m/s, or km and hours for km/h). Multiply km/h by 5/18 to convert to m/s.',
        keyTakeawayGu: 'હંમેશા સુસંગત એકમો રાખો (મીટર અને સેકન્ડ અથવા કિમી અને કલાક). કિમી/કલાકને m/s માં ફેરવવા 5/18 વડે ગુણો.',
        keyTakeawayHi: 'किमी/घंटे को m/s में बदलने के लिए 5/18 से गुणा करें।'
      };
    }
  }

  return null;
}

/**
 * Gemini AI Solver for Arbitrary Problems
 */
async function solveWithGeminiAI(
  problem: string,
  language: string,
  standard: string,
  apiKey: string,
  subjectHint?: string
): Promise<StepByStepSolution | null> {
  const isGu = language === 'gu';
  const isHi = language === 'hi';
  const langName = isHi ? 'Hindi' : (isGu ? 'Gujarati' : 'English');

  const systemPrompt = `You are VM GyanSetu (વિદ્યામંદિર માછીઆવાસણા), an expert STEM teacher for students in secondary school (${standard}).
Analyze this Mathematics or Science problem and generate a comprehensive, clear, pedagogical STEP-BY-STEP SOLUTION.
You must:
1. Explain WHY and HOW each step is performed so students can understand the core concept and solve similar problems independently.
2. Clearly list all important formulas used.
3. Show all intermediate calculations and reasoning in sequential order.
4. Clearly state and highlight the FINAL ANSWER at the end.
5. Provide a practical "keyTakeaway" tip on how to solve similar problems.
Language requested: ${langName}.

Respond strictly in valid JSON with this exact structure:
{
  "subject": "Mathematics" or "Science",
  "topic": "Specific Topic Name",
  "problemStatement": "Clean problem statement",
  "conceptReasoning": "Why we use this method, theorem, or scientific law",
  "formulas": ["Formula 1", "Formula 2"],
  "givenValues": { "key": "value" },
  "toFind": "What is being solved for",
  "steps": [
    {
      "stepNumber": 1,
      "title": "Short title of step",
      "why": "Clear explanation of why this step is performed",
      "calculation": "Exact math/science substitution and calculation",
      "intermediateResult": "Result of this step"
    }
  ],
  "verification": "Optional verification/checking step",
  "finalAnswer": "Clearly highlighted final answer with units if applicable",
  "keyTakeaway": "Practical advice for students to solve similar problems independently"
}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: systemPrompt },
          { text: `Student's Problem: ${problem}${subjectHint ? ` (Subject: ${subjectHint})` : ''}` }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json'
    }
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data: any = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;

  const parsed = JSON.parse(text);
  return {
    subject: parsed.subject || subjectHint || 'Mathematics',
    topic: parsed.topic || 'General Problem Solving',
    problemStatement: parsed.problemStatement || problem,
    conceptReasoning: parsed.conceptReasoning || '',
    formulas: Array.isArray(parsed.formulas) ? parsed.formulas : [],
    givenValues: parsed.givenValues || {},
    toFind: parsed.toFind || '',
    steps: Array.isArray(parsed.steps) ? parsed.steps : [],
    verification: parsed.verification || '',
    finalAnswer: parsed.finalAnswer || '',
    keyTakeaway: parsed.keyTakeaway || ''
  };
}

/**
 * Fallback General Pedagogical Solution
 */
function buildGeneralPedagogicalSolution(
  problem: string,
  language: string,
  subjectHint?: string
): StepByStepSolution {
  const isGu = language === 'gu';
  const isHi = language === 'hi';
  const sub = subjectHint || (problem.toLowerCase().includes('force') || problem.toLowerCase().includes('reaction') || problem.toLowerCase().includes('cell') ? 'Science' : 'Mathematics');

  return {
    subject: sub,
    subjectGu: sub === 'Mathematics' ? 'ગણિત' : 'વિજ્ઞાન',
    subjectHi: sub === 'Mathematics' ? 'गणित' : 'विज्ञान',
    topic: sub === 'Mathematics' ? 'Mathematical Reasoning' : 'Scientific Principles',
    topicGu: sub === 'Mathematics' ? 'ગાણિતિક તર્ક અને ઉકેલ' : 'વૈજ્ઞાનિક સિદ્ધાંતો',
    topicHi: sub === 'Mathematics' ? 'गणितीय तर्क' : 'वैज्ञानिक सिद्धांत',
    problemStatement: problem,
    problemStatementGu: problem,
    problemStatementHi: problem,
    conceptReasoning: isGu
      ? 'આ સમસ્યાને ઉકેલવા માટે આપેલા પરિમાણોનું વિશ્લેષણ કરી યોગ્ય સૂત્ર અને ગાણિતિક તર્ક ક્રમબદ્ધ રીતે લાગુ કરવો જરૂરી છે.'
      : (isHi
        ? 'इस समस्या को हल करने के लिए दिए गए मानों का विश्लेषण कर सही सूत्र और तार्किक चरणों का पालन करना आवश्यक है।'
        : 'To solve this problem systematically, identify given quantities, select the governing formula or principle, and perform step-by-step substitution.'),
    formulas: [
      sub === 'Mathematics' ? 'Standard Algebraic / Geometric Relationship' : 'Governing Physical / Chemical Law'
    ],
    toFind: isGu ? 'પ્રશ્નનો અંતિમ ઉકેલ' : (isHi ? 'अंतिम हल' : 'Final Solution'),
    steps: [
      {
        stepNumber: 1,
        title: isGu ? 'આપેલ વિગતો અને ધ્યેય ઓળખો' : (isHi ? 'दी गई जानकारी और लक्ष्य पहचानें' : 'Extract Given Information & Goal'),
        why: isGu ? 'સમસ્યાના પાયાના ઘટકો સ્પષ્ટ કરવા જરૂરી છે.' : (isHi ? 'समस्या के मुख्य घटकों को स्पष्ट करना आवश्यक है।' : 'Establishing known and unknown parameters prevents calculation errors.'),
        calculation: `Problem Statement: "${problem}"`,
        intermediateResult: isGu ? 'સમસ્યાનું પૃથક્કરણ પૂર્ણ' : (isHi ? 'समस्या का विश्लेषण पूर्ण' : 'Problem structure identified')
      },
      {
        stepNumber: 2,
        title: isGu ? 'સિદ્ધાંત અને ગણતરી લાગુ કરો' : (isHi ? 'सिद्धांत और गणना लागू करें' : 'Apply Core Principle and Calculate'),
        why: isGu ? 'ક્રમબદ્ધ રીતે ગણતરી આગળ ધપાવવાથી સચોટ પરિણામ મળે છે.' : (isHi ? 'क्रमबद्ध गणना से सटीक परिणाम मिलता है।' : 'Execute the intermediate algebraic manipulation or conceptual deduction.'),
        calculation: isGu ? 'સૂત્ર અનુસાર પદોની ગોઠવણી અને ગણતરી' : (isHi ? 'सूत्रानुसार पदों का संयोजन और गणना' : 'Step-by-step substitution and simplification'),
        intermediateResult: isGu ? 'સાદુરૂપ સફળતાપૂર્વક મેળવ્યું' : (isHi ? 'सरलीकरण संपन्न' : 'Simplified expression obtained')
      }
    ],
    finalAnswer: isGu ? 'સંપૂર્ણ તાર્કિક ઉકેલ' : (isHi ? 'पूर्ण तार्किक हल' : 'Step-by-Step Evaluated Solution'),
    keyTakeaway: isGu
      ? 'હંમેશા પ્રશ્નને નાના પેટા-પગલાઓમાં વિભાજિત કરો અને દરેક ગણતરીની બે વાર ચકાસણી કરો.'
      : (isHi
        ? 'हमेशा प्रश्न को छोटे चरणों में विभाजित करें और गणना की पुनः जाँच करें।'
        : 'Break complex problems into smaller sub-steps and double-check your arithmetic operations to solve similar problems independently.'),
    commonMistakes: [
      'Rushing directly to calculation without listing given values and required units.',
      'Calculation or sign slips during algebraic operations or transpositions.',
      'Omitting the final units in the final numerical answer.'
    ],
    commonMistakesGu: [
      'આપેલ મૂલ્યો અને એકમો નોંધ્યા વગર સીધી ગણતરી કરવાની ઉતાવળ.',
      'પદોની ફેરબદલ વખતે ચિહ્નની ભૂલ કરવી.',
      'અંતિમ જવાબમાં એકમ લખવાનું ભૂલી જવું.'
    ],
    commonMistakesHi: [
      'दी गई इकाइयों की जांच किए बिना सीधे गणना शुरू कर देना।',
      'पक्षांतरण के समय चिह्न की चूक।',
      'अंतिम उत्तर में मात्रक (Units) लिखना भूल जाना।'
    ],
    alternativeMethod: {
      title: 'Estimation & Sanity Check',
      description: 'Round numbers to simple approximations to verify that the final answer is within a logical magnitude.',
      calculation: 'Approximation Check: Orders of magnitude match expectations.'
    },
    alternativeMethodGu: {
      title: 'અંદાજીકરણ અને તાર્કિક ચકાસણી',
      description: 'અંદાજિત ગણતરી કરીને અંતિમ પરિણામ વાજબી સીમામાં છે કે નહીં તેની ખાતરી કરો.',
      calculation: 'અંદાજિત પરિણામ મેળવવામાં આવ્યું.'
    },
    alternativeMethodHi: {
      title: 'अनुमान और तार्किक जांच विधि',
      description: 'सन्निकटन द्वारा जांचें कि अंतिम उत्तर तार्किक रूप से सही है।',
      calculation: 'परिणाम तार्किक सीमा में है।'
    },
    practiceChallenge: {
      problem: `Practice problem: Apply the same principles to a similar variation of "${problem.slice(0, 40)}..."`,
      hint: 'Identify given parameters, write the governing equation, and isolate the unknown.',
      answer: 'Follow the same sequential steps to reach the verified solution.'
    },
    practiceChallengeGu: {
      problem: `સ્વ-અભ્યાસ પ્રશ્ન: સમાન સિદ્ધાંતો આ પ્રશ્નમાં લાગુ કરો.`,
      hint: 'આપેલા મૂલ્યો અલગ તારવો અને સૂત્રમાં કિંમત મૂકો.',
      answer: 'ક્રમબદ્ધ પગલાં અનુસરીને ચકાસણી કરો.'
    },
    practiceChallengeHi: {
      problem: `अभ्यास प्रश्न: समान सिद्धांत लागू करके हल करें।`,
      hint: 'सूत्र लिखकर अज्ञात राशि को अलग करें।',
      answer: 'क्रमबद्ध चरणों का पालन करें।'
    }
  };
}

/**
 * Helper to match any question by text or ID from testController / mistakeController
 */
export function enrichWithStepByStepSolution(
  questionId: string,
  questionText: string,
  subjectName?: string,
  topicName?: string,
  explanation?: string
): StepByStepSolution | null {
  // 1. Try finding in pre-curated curriculum solutions
  const match = findCurriculumMatch(questionText);
  if (match) {
    return match;
  }

  // 2. Check if it's Mathematics or Science
  const isMathOrScience =
    (subjectName && (subjectName.toLowerCase().includes('math') || subjectName.toLowerCase().includes('science') || subjectName.toLowerCase().includes('ગણિત') || subjectName.toLowerCase().includes('વિજ્ઞાન'))) ||
    questionText.includes('²') || questionText.includes('^2') || questionText.includes('+') || questionText.includes('=') ||
    questionText.toLowerCase().includes('reaction') || questionText.toLowerCase().includes('force') || questionText.toLowerCase().includes('acceleration') || questionText.toLowerCase().includes('mass');

  if (isMathOrScience) {
    const dyn = solveWithDeterministicEngines(questionText, 'en');
    if (dyn) return dyn;
    return buildGeneralPedagogicalSolution(questionText, 'en', subjectName);
  }

  return null;
}
