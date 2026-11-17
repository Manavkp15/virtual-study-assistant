import { ExtractedPageData, OCRProcessingResult } from './ocrVisionService';

export interface RubricItem {
  criterion: string;
  marks: number;
}

export interface RubricEvaluationBreakdown {
  criterion: string;
  maxMarks: number;
  awardedMarks: number;
  reason: string;
  isMet: boolean;
}

export interface QuestionInput {
  id?: string;
  questionNumber: number;
  questionText: string;
  questionTextGu?: string | null;
  maxMarks: number;
  modelAnswer: string;
  modelAnswerGu?: string | null;
  alternativeAnswers?: string[] | null;
  rubric?: RubricItem[] | null;
  keywords?: string[] | null;
}

export interface QuestionGradingResult {
  questionNumber: number;
  questionText: string;
  maxMarks: number;
  aiMarks: number;
  studentAnswerText: string;
  status: 'CORRECT' | 'PARTIALLY_CORRECT' | 'INCORRECT' | 'NEEDS_TEACHER_REVIEW';
  confidenceScore: number;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  needsTeacherReview: boolean;
  rubricBreakdown: RubricEvaluationBreakdown[];
  missingPoints: string[];
  incorrectStatements: string[];
  aiFeedback: string;
}

export interface SubmissionEvaluationResult {
  totalQuestions: number;
  maxScore: number;
  aiScore: number;
  percentage: number;
  aiConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
  overallFeedback: string;
  questions: QuestionGradingResult[];
  reviewStatus: 'AI_CHECKED' | 'PENDING_TEACHER_REVIEW';
  ocrPages: ExtractedPageData[];
}

/**
 * Normalizes text for linguistic matching (handles punctuation, casing, spacing)
 */
function normalizeForComparison(str: string): string {
  return str
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks semantic token / keyword overlap allowing synonyms and minor stem variations
 */
function checkConceptPresent(
  studentText: string,
  conceptPhrase: string,
  synonyms: Record<string, string[]> = {}
): { found: boolean; score: number } {
  const normStudent = normalizeForComparison(studentText);
  const normConcept = normalizeForComparison(conceptPhrase);

  if (normStudent.includes(normConcept)) {
    return { found: true, score: 1.0 };
  }

  // Tokenize concept words, filtering short stopwords
  const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'of', 'by', 'for', 'with', 'to', 'from']);
  const conceptWords = normConcept
    .split(' ')
    .filter(w => w.length > 2 && !stopWords.has(w));

  if (conceptWords.length === 0) {
    return { found: true, score: 1.0 };
  }

  let matchedWords = 0;
  for (const word of conceptWords) {
    // Check direct word or prefix
    if (normStudent.includes(word) || (word.length > 4 && normStudent.includes(word.substring(0, word.length - 2)))) {
      matchedWords++;
      continue;
    }

    // Check known educational synonyms
    const wordSynonyms = synonyms[word] || [];
    const hasSynonym = wordSynonyms.some(syn => normStudent.includes(normalizeForComparison(syn)));
    if (hasSynonym) {
      matchedWords++;
    }
  }

  const matchRatio = matchedWords / conceptWords.length;
  return {
    found: matchRatio >= 0.60,
    score: matchRatio
  };
}

/**
 * Common school subject synonyms and morphological alternatives (Science, Math, Social Science)
 */
const COMMON_SYNONYMS: Record<string, string[]> = {
  photosynthesis: ['food making', 'food preparation', 'producing food', 'khurak banavani prakriya', 'prakash sanshleshan'],
  sunlight: ['solar energy', 'sun light', 'light energy', 'surya prakash'],
  chlorophyll: ['green pigment', 'chloroplast', 'haritkarna', 'parnaharit'],
  water: ['h2o', 'moisture', 'pani', 'jal'],
  carbon: ['co2', 'carbon dioxide', 'carbonic acid'],
  dioxide: ['co2', 'carbon dioxide'],
  equation: ['algebraic relation', 'equality', 'expression'],
  substitution: ['replacing', 'substituting', 'adesh'],
  force: ['push or pull', 'interaction', 'bal', 'newton'],
  pressure: ['force per unit area', 'thrust per area', 'daban'],
  acceleration: ['rate of change of velocity', 'speed increase', 'prayog', 'tvarn'],
  velocity: ['speed in direction', 'motion rate', 'veg']
};

/**
 * Extract / segment student answers per question from full OCR text
 */
export function segmentAnswersByQuestion(
  fullText: string,
  questions: QuestionInput[]
): Map<number, string> {
  const result = new Map<number, string>();
  if (!fullText) return result;

  const lines = fullText.split('\n');
  let currentQNum: number | null = null;
  let currentBuffer: string[] = [];

  // Regex patterns matching Q1, Question 1, Ans 1, 1., etc.
  const qNumRegex = /^(?:q(?:uestion)?\.?|ans(?:wer)?\.?|que\.?|પ્રશ્ન|ઉત્તર|प्रश्न|उत्तर)?\s*(\d{1,2})[\.\:\)\-\s]/i;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const match = line.match(qNumRegex);
    if (match) {
      const detectedNum = parseInt(match[1], 10);
      const isKnownQuestion = questions.some(q => q.questionNumber === detectedNum);

      if (isKnownQuestion) {
        if (currentQNum !== null && currentBuffer.length > 0) {
          result.set(currentQNum, currentBuffer.join(' ').trim());
        }
        currentQNum = detectedNum;
        currentBuffer = [];
        // Extract any text after the question header on the same line
        const textAfterHeader = line.replace(qNumRegex, '').trim();
        if (textAfterHeader) {
          currentBuffer.push(textAfterHeader);
        }
        continue;
      }
    }

    if (currentQNum !== null) {
      currentBuffer.push(line);
    }
  }

  if (currentQNum !== null && currentBuffer.length > 0) {
    result.set(currentQNum, currentBuffer.join(' ').trim());
  }

  // Fallback: If only 1 question or regex missed, distribute text
  if (result.size === 0 && questions.length === 1) {
    result.set(questions[0].questionNumber, fullText.trim());
  } else if (result.size === 0 && fullText.trim().length > 0) {
    // Assign entire text to first question for teacher review
    result.set(questions[0].questionNumber, fullText.trim());
  }

  return result;
}

/**
 * Evaluate single question with local semantic rubric engine
 */
export function evaluateQuestionLocally(
  q: QuestionInput,
  studentAnswer: string,
  isLegible: boolean,
  language: string = 'en'
): QuestionGradingResult {
  const maxMarks = q.maxMarks || 5;
  const isGu = language === 'gu';
  const isHi = language === 'hi';

  // 1. If handwriting is illegible or missing
  if (!isLegible || !studentAnswer || studentAnswer.trim().length < 4) {
    return {
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      maxMarks,
      aiMarks: 0,
      studentAnswerText: studentAnswer || '',
      status: 'NEEDS_TEACHER_REVIEW',
      confidenceScore: 35,
      confidenceLevel: 'LOW',
      needsTeacherReview: true,
      rubricBreakdown: (q.rubric || []).map(r => ({
        criterion: r.criterion,
        maxMarks: r.marks,
        awardedMarks: 0,
        reason: isGu
          ? 'હસ્તલેખન અસ્પષ્ટ છે. શિક્ષકની સમીક્ષા જરૂરી છે.'
          : isHi
          ? 'हस्तलेखन स्पष्ट नहीं है। शिक्षक समीक्षा आवश्यक है।'
          : 'Handwriting could not be read clearly. Teacher review required.',
        isMet: false
      })),
      missingPoints: [
        isGu
          ? 'હસ્તલેખન સ્પષ્ટ વાંચી શકાયું નથી'
          : isHi
          ? 'हस्तलेखन स्पष्ट रूप से पढ़ा नहीं जा सका'
          : 'Handwriting could not be read clearly'
      ],
      incorrectStatements: [],
      aiFeedback: isGu
        ? 'તમારો ઉત્તર અસ્પષ્ટ અથવા અપૂર્ણ જણાય છે. શિક્ષક દ્વારા તેની ચકાસણી કરવામાં આવશે.'
        : isHi
        ? 'आपका उत्तर अस्पष्ट या अधूरा प्रतीत होता है। शिक्षक द्वारा इसकी जाँच की जाएगी।'
        : 'Your answer could not be read clearly. The teacher will review your handwritten submission.'
    };
  }

  // 2. Check acceptable alternative answers
  const alternatives = q.alternativeAnswers || [];
  for (const alt of alternatives) {
    const { found, score } = checkConceptPresent(studentAnswer, alt, COMMON_SYNONYMS);
    if (found && score >= 0.85) {
      return {
        questionNumber: q.questionNumber,
        questionText: q.questionText,
        maxMarks,
        aiMarks: maxMarks,
        studentAnswerText: studentAnswer,
        status: 'CORRECT',
        confidenceScore: 92,
        confidenceLevel: 'HIGH',
        needsTeacherReview: false,
        rubricBreakdown: (q.rubric || [{ criterion: 'Accepted Alternative Answer', marks: maxMarks }]).map(r => ({
          criterion: r.criterion,
          maxMarks: r.marks,
          awardedMarks: r.marks,
          reason: 'Matches accepted alternative explanation.',
          isMet: true
        })),
        missingPoints: [],
        incorrectStatements: [],
        aiFeedback: isGu
          ? 'ઉત્કૃષ્ટ! તમારો ઉત્તર માન્ય વૈકલ્પિક સમજૂતી સાથે સંપૂર્ણ સુસંગત છે.'
          : isHi
          ? 'उत्कृष्ट! आपका उत्तर मान्य वैकल्पिक व्याख्या के साथ पूर्णतः सही है।'
          : 'Excellent! Your answer is completely accurate with a valid alternative explanation.'
      };
    }
  }

  // 3. Rubric-based evaluation
  const rubrics: RubricItem[] = (q.rubric && q.rubric.length > 0)
    ? q.rubric
    : [
        { criterion: q.modelAnswer.substring(0, 60), marks: maxMarks }
      ];

  const rubricBreakdown: RubricEvaluationBreakdown[] = [];
  const missingPoints: string[] = [];
  let totalAwarded = 0;

  for (const r of rubrics) {
    const { found, score } = checkConceptPresent(studentAnswer, r.criterion, COMMON_SYNONYMS);
    let awarded = 0;
    let reason = '';

    if (found) {
      if (score >= 0.85) {
        awarded = r.marks;
        reason = isGu ? 'મુદ્દો સંપૂર્ણ રીતે આવરી લેવાયેલ છે.' : isHi ? 'बिंदु पूरी तरह से स्पष्ट है।' : 'Point completely covered.';
      } else {
        awarded = Math.round((r.marks * score) * 2) / 2; // round to 0.5
        reason = isGu ? 'મુદ્દો આંશિક રીતે સમજાવેલ છે.' : isHi ? 'बिंदु आंशिक रूप से समझाया गया है।' : 'Point partially explained.';
      }
    } else {
      awarded = 0;
      reason = isGu ? 'આ મુદ્દો ઉત્તરમાં ખૂટે છે.' : isHi ? 'यह बिंदु उत्तर में अनुपस्थित है।' : 'This point is missing from the answer.';
      missingPoints.push(r.criterion);
    }

    totalAwarded += awarded;
    rubricBreakdown.push({
      criterion: r.criterion,
      maxMarks: r.marks,
      awardedMarks: awarded,
      reason,
      isMet: awarded > 0
    });
  }

  // Check additional keywords
  if (q.keywords && q.keywords.length > 0) {
    for (const kw of q.keywords) {
      const { found } = checkConceptPresent(studentAnswer, kw, COMMON_SYNONYMS);
      if (!found && !missingPoints.some(m => m.toLowerCase().includes(kw.toLowerCase()))) {
        missingPoints.push(kw);
      }
    }
  }

  // Ensure total awarded doesn't exceed maxMarks
  const finalAiMarks = Math.min(maxMarks, Math.max(0, Math.round(totalAwarded * 2) / 2));
  const marksRatio = finalAiMarks / maxMarks;

  let status: 'CORRECT' | 'PARTIALLY_CORRECT' | 'INCORRECT' | 'NEEDS_TEACHER_REVIEW';
  let confidenceScore = 88;
  let confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';
  let needsTeacherReview = false;

  if (marksRatio >= 0.90) {
    status = 'CORRECT';
    confidenceScore = 92;
    confidenceLevel = 'HIGH';
  } else if (marksRatio > 0.0) {
    status = 'PARTIALLY_CORRECT';
    confidenceScore = 78;
    confidenceLevel = 'MEDIUM';
  } else {
    status = 'INCORRECT';
    confidenceScore = 80;
    confidenceLevel = 'MEDIUM';
  }

  // If subjective answer with medium-to-low confidence, flag for teacher review
  if (confidenceScore < 60 || (marksRatio > 0.2 && marksRatio < 0.6)) {
    confidenceLevel = 'LOW';
    needsTeacherReview = true;
  }

  // Constructive feedback generation
  let aiFeedback = '';
  if (status === 'CORRECT') {
    aiFeedback = isGu
      ? 'ખૂબ સરસ! તમારો ઉત્તર સ્પષ્ટ અને સંપૂર્ણ છે. બધા મુખ્ય મુદ્દા આવરી લીધા છે.'
      : isHi
      ? 'बहुत बढ़िया! आपका उत्तर स्पष्ट और संपूर्ण है। सभी मुख्य बिंदु शामिल हैं।'
      : 'Great job! Your answer is clear, accurate, and covers all required key concepts.';
  } else if (status === 'PARTIALLY_CORRECT') {
    const missingStr = missingPoints.slice(0, 3).join(', ');
    aiFeedback = isGu
      ? `તમારી મૂળભૂત સમજ યોગ્ય છે. પૂરા ગુણ મેળવવા માટે: ${missingStr} નો સમાવેશ કરો.`
      : isHi
      ? `आपकी मूल समझ अच्छी है। पूर्ण अंक प्राप्त करने के लिए: ${missingStr} को भी शामिल करें।`
      : `Your basic concept is correct. To score full marks, also include: ${missingStr}.`;
  } else {
    aiFeedback = isGu
      ? 'ઉત્તર અપૂર્ણ અથવા અસંગત છે. કૃપા કરીને પ્રકરણનું પુનરાવર્તન કરો અને મુખ્ય વ્યાખ્યા ફરી વાંચો.'
      : isHi
      ? 'उत्तर अधूरा या असंगत है। कृपया अध्याय का पुनरावलोकन करें और मुख्य परिभाषा को पुनः पढ़ें।'
      : 'Your answer is incomplete or off-target. Revise this chapter and include the core definition and requirements.';
  }

  return {
    questionNumber: q.questionNumber,
    questionText: q.questionText,
    maxMarks,
    aiMarks: finalAiMarks,
    studentAnswerText: studentAnswer,
    status,
    confidenceScore,
    confidenceLevel,
    needsTeacherReview,
    rubricBreakdown,
    missingPoints,
    incorrectStatements: [],
    aiFeedback
  };
}

/**
 * Optional Gemini LLM Rubric Evaluation for advanced handwriting & semantic nuances
 */
async function evaluateWithGemini(
  questions: QuestionInput[],
  segmentedAnswers: Map<number, string>,
  language: string,
  apiKey: string
): Promise<QuestionGradingResult[] | null> {
  try {
    const promptQuestions = questions.map(q => ({
      qNum: q.questionNumber,
      question: q.questionText,
      maxMarks: q.maxMarks,
      modelAnswer: q.modelAnswer,
      rubric: q.rubric || [],
      keywords: q.keywords || [],
      studentAnswer: segmentedAnswers.get(q.questionNumber) || ''
    }));

    const systemPrompt = `You are an expert school exam and homework grading AI.
Evaluate the student's handwritten answers against the teacher's model answer and marking rubric.
Language: ${language === 'gu' ? 'Gujarati' : language === 'hi' ? 'Hindi' : 'English'}.

CRUCIAL GRADING RULES:
1. Do NOT mark answers wrong merely because the wording, sentence structure or synonyms differ from the model answer.
2. Accept equivalent explanations, rephrased definitions, and minor grammar or spelling errors that do not alter the meaning.
3. For subjective answers, strictly apply the teacher's rubric criteria and keyword presence.
4. If handwriting is illegible or empty: status='NEEDS_TEACHER_REVIEW', aiMarks=0, confidenceScore=30, confidenceLevel='LOW', needsTeacherReview=true.
5. Provide constructive feedback in ${language === 'gu' ? 'Gujarati' : language === 'hi' ? 'Hindi' : 'English'}.
6. Identify missing points and any incorrect statements.

Return ONLY a JSON array of objects conforming to:
[
  {
    "questionNumber": 1,
    "aiMarks": 3.0,
    "maxMarks": 5.0,
    "status": "CORRECT" | "PARTIALLY_CORRECT" | "INCORRECT" | "NEEDS_TEACHER_REVIEW",
    "confidenceScore": 85,
    "confidenceLevel": "HIGH" | "MEDIUM" | "LOW",
    "needsTeacherReview": false,
    "rubricBreakdown": [
      { "criterion": "Definition", "maxMarks": 2, "awardedMarks": 2, "reason": "...", "isMet": true }
    ],
    "missingPoints": ["..."],
    "incorrectStatements": [],
    "aiFeedback": "..."
  }
]`;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: systemPrompt },
            { text: JSON.stringify(promptQuestions) }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json'
      }
    };

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    );

    if (!res.ok) {
      console.warn(`[Grading Engine] Gemini LLM grading returned status ${res.status}`);
      return null;
    }

    const data: any = await res.json();
    const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    const parsed = JSON.parse(rawJson);

    if (!Array.isArray(parsed) || parsed.length === 0) return null;

    return parsed.map((item: any) => {
      const q = questions.find(q => q.questionNumber === item.questionNumber) || questions[0];
      return {
        questionNumber: item.questionNumber || q.questionNumber,
        questionText: q.questionText,
        maxMarks: q.maxMarks,
        aiMarks: Number(item.aiMarks) || 0,
        studentAnswerText: segmentedAnswers.get(q.questionNumber) || '',
        status: item.status || 'PARTIALLY_CORRECT',
        confidenceScore: Number(item.confidenceScore) || 85,
        confidenceLevel: item.confidenceLevel || 'HIGH',
        needsTeacherReview: Boolean(item.needsTeacherReview),
        rubricBreakdown: item.rubricBreakdown || [],
        missingPoints: item.missingPoints || [],
        incorrectStatements: item.incorrectStatements || [],
        aiFeedback: item.aiFeedback || 'Evaluation completed.'
      };
    });
  } catch (err: any) {
    console.warn('[Grading Engine] Gemini evaluation error:', err.message);
    return null;
  }
}

/**
 * Main Evaluation Entry Point for Student Homework Submissions
 */
export async function evaluateHomeworkSubmission(
  questions: QuestionInput[],
  ocrResult: OCRProcessingResult,
  language: string = 'en'
): Promise<SubmissionEvaluationResult> {
  const isGu = language === 'gu';
  const isHi = language === 'hi';
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  // 1. Segment student handwriting into individual questions
  const segmentedAnswers = segmentAnswersByQuestion(ocrResult.fullText, questions);

  let questionResults: QuestionGradingResult[] = [];

  // 2. Try Gemini API first if configured
  if (apiKey && apiKey.length > 10 && ocrResult.isHandwritingLegible) {
    const geminiGrading = await evaluateWithGemini(questions, segmentedAnswers, language, apiKey);
    if (geminiGrading && geminiGrading.length > 0) {
      questionResults = geminiGrading;
    }
  }

  // 3. Fallback to Local Semantic Rubric Engine
  if (questionResults.length === 0) {
    questionResults = questions.map(q => {
      const studentAns = segmentedAnswers.get(q.questionNumber) || '';
      return evaluateQuestionLocally(q, studentAns, ocrResult.isHandwritingLegible, language);
    });
  }

  // 4. Calculate overall statistics
  let totalMaxMarks = 0;
  let totalAiMarks = 0;
  let totalConfidence = 0;
  let anyNeedsReview = false;

  for (const res of questionResults) {
    totalMaxMarks += res.maxMarks;
    totalAiMarks += res.aiMarks;
    totalConfidence += res.confidenceScore;
    if (res.needsTeacherReview || res.confidenceLevel === 'LOW') {
      anyNeedsReview = true;
    }
  }

  totalMaxMarks = Math.max(1, totalMaxMarks);
  const percentage = Math.round((totalAiMarks / totalMaxMarks) * 100);
  const avgConfidence = Math.round(totalConfidence / questionResults.length);

  const overallConfidence: 'HIGH' | 'MEDIUM' | 'LOW' =
    avgConfidence >= 85 ? 'HIGH' : avgConfidence >= 60 ? 'MEDIUM' : 'LOW';

  // Construct overall summary feedback
  let overallFeedback = '';
  if (percentage >= 80) {
    overallFeedback = isGu
      ? `અભિનંદન! તમે ${percentage}% ગુણ પ્રાપ્ત કર્યા છે. તમારા ઉત્તરો ચોક્કસ અને વિગતવાર છે.`
      : isHi
      ? `बधाई हो! आपने ${percentage}% अंक प्राप्त किए हैं। आपके उत्तर सटीक और विस्तृत हैं।`
      : `Outstanding work! You scored ${percentage}%. Your answers demonstrate strong understanding.`;
  } else if (percentage >= 50) {
    overallFeedback = isGu
      ? `સારું કાર્ય! તમે ${percentage}% ગુણ મેળવ્યા છે. શિક્ષકના મોડેલ ઉત્તર મુજબ ખૂટતા મુદ્દાઓનું પુનરાવર્તન કરો.`
      : isHi
      ? `अच्छा प्रयास! आपने ${percentage}% अंक प्राप्त किए हैं। मॉडल उत्तर के अनुसार छूटे हुए बिंदुओं का अभ्यास करें।`
      : `Good effort! You scored ${percentage}%. Review the missing points from the model answer.`;
  } else {
    overallFeedback = isGu
      ? `તમે ${percentage}% ગુણ મેળવ્યા છે. કૃપા કરીને પ્રકરણના મુખ્ય મુદ્દાઓનું પુનરાવર્તન કરો.`
      : isHi
      ? `आपने ${percentage}% अंक प्राप्त किए हैं। कृपया अध्याय के मुख्य बिंदुओं का पुनः अध्ययन करें।`
      : `You scored ${percentage}%. Please review the model answers and revise the key concepts.`;
  }

  return {
    totalQuestions: questions.length,
    maxScore: totalMaxMarks,
    aiScore: totalAiMarks,
    percentage,
    aiConfidence: overallConfidence,
    overallFeedback,
    questions: questionResults,
    reviewStatus: anyNeedsReview ? 'PENDING_TEACHER_REVIEW' : 'AI_CHECKED',
    ocrPages: ocrResult.pages
  };
}
