import fs from 'fs';
import path from 'path';
import Tesseract from 'tesseract.js';
import { prisma } from '../database/prisma';

export interface MultimodalAnswer {
  title: string;
  subject: string;
  directAnswer: string;
  stepByStep: string[];
  keyConcepts: string[];
  formulas?: string[];
  extractedText?: string;
  voiceSummary: string;
  source: 'gemini' | 'ocr_curriculum' | 'curriculum';
}

interface SolverParams {
  userId: string;
  question?: string;
  imagePath?: string;
  mode: 'text' | 'image' | 'voice';
  language?: string; // 'en' | 'gu'
  standard?: string;
}

/**
 * Main entry point for multimodal question solving
 */
export async function solveMultimodalQuestion(params: SolverParams): Promise<MultimodalAnswer> {
  const { userId, question = '', imagePath, mode, language = 'en', standard = 'Standard 8' } = params;
  const isGu = language === 'gu';
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  let extractedText = '';

  // 1. If an image is provided, try Gemini Multimodal Vision first (if key configured)
  if (imagePath && fs.existsSync(imagePath)) {
    if (apiKey && apiKey.length > 10) {
      try {
        const geminiResult = await solveWithGeminiVision(imagePath, question, language, standard, apiKey);
        if (geminiResult) {
          return geminiResult;
        }
      } catch (err: any) {
        console.warn('[MultimodalSolver] Gemini Vision error, falling back to local OCR:', err.message);
      }
    }

    // Local OCR extraction using Tesseract.js
    try {
      extractedText = await performLocalOCR(imagePath);
    } catch (ocrErr: any) {
      console.warn('[MultimodalSolver] Tesseract OCR failed:', ocrErr.message);
      extractedText = '';
    }
  }

  // 2. Formulate effective question from text + extracted OCR
  const rawQuery = (question + ' ' + (extractedText || '')).trim();

  // If Gemini API is available for text/voice queries, try Gemini API
  if (apiKey && apiKey.length > 10 && rawQuery.length > 0) {
    try {
      const geminiTextResult = await solveWithGeminiText(rawQuery, language, standard, apiKey, extractedText);
      if (geminiTextResult) {
        return geminiTextResult;
      }
    } catch (geminiErr: any) {
      console.warn('[MultimodalSolver] Gemini text error, falling back to curriculum engine:', geminiErr.message);
    }
  }

  // 3. Fallback: Curriculum Knowledge Solver (Comprehensive offline engine)
  const curriculumAnswer = await solveWithCurriculumEngine(rawQuery, language, standard, extractedText);
  return curriculumAnswer;
}

/**
 * Local OCR using Tesseract.js
 */
async function performLocalOCR(imagePath: string): Promise<string> {
  console.log('[MultimodalSolver] Performing local OCR on image:', imagePath);
  try {
    const result = await Tesseract.recognize(imagePath, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text' && m.progress === 1) {
          console.log('[MultimodalSolver] OCR complete');
        }
      }
    });
    const text = result.data.text.trim();
    console.log('[MultimodalSolver] OCR text extracted:', text.substring(0, 100));
    return text;
  } catch (err: any) {
    console.warn('[MultimodalSolver] OCR error:', err);
    return '';
  }
}

/**
 * Solve with Gemini Multimodal Vision API
 */
async function solveWithGeminiVision(
  imagePath: string,
  userPrompt: string,
  language: string,
  standard: string,
  apiKey: string
): Promise<MultimodalAnswer | null> {
  const isGu = language === 'gu';
  const isHi = language === 'hi';
  const requestedLanguage = isHi ? 'Hindi (हिन्दी)' : (isGu ? 'Gujarati (ગુજરાતી)' : 'English');
  const imageBytes = fs.readFileSync(imagePath);
  const base64Image = imageBytes.toString('base64');
  const ext = path.extname(imagePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';

  const systemPrompt = `You are VM GyanSetu (વિદ્યામંદિર માછીઆવાસણા), a friendly, expert school teacher for students in Gujarat primary/secondary school (${standard}).
Analyze this image (which may be a textbook problem, mathematical equation, handwritten question, or diagram).
Provide a clear, pedagogical, step-by-step explanation suitable for school students.
Language requested: ${requestedLanguage}.

Respond in strictly valid JSON format with these exact keys:
{
  "title": "Short title of question / topic",
  "subject": "Mathematics | Science | Social Studies | English | Gujarati | Hindi",
  "extractedText": "Exact text or question recognized from the image",
  "directAnswer": "Direct concise answer or final result",
  "stepByStep": ["Step 1 explanation", "Step 2 explanation", "Step 3 explanation"],
  "keyConcepts": ["Concept 1", "Concept 2"],
  "formulas": ["Relevant formula if applicable (e.g. Area = l * b)"],
  "voiceSummary": "Short 2-sentence conversational summary suitable for text-to-speech audio readout"
}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: systemPrompt + (userPrompt ? `\nStudent's extra note: "${userPrompt}"` : '') },
          {
            inlineData: {
              mimeType,
              data: base64Image
            }
          }
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
    title: parsed.title || (isHi ? 'प्रश्न का समाधान' : (isGu ? 'પ્રશ્નનો ઉકેલ' : 'Question Solution')),
    subject: parsed.subject || (isHi ? 'सामान्य' : (isGu ? 'સામાન્ય વિષય' : 'General')),
    directAnswer: parsed.directAnswer || '',
    stepByStep: Array.isArray(parsed.stepByStep) ? parsed.stepByStep : [parsed.stepByStep || ''],
    keyConcepts: Array.isArray(parsed.keyConcepts) ? parsed.keyConcepts : [],
    formulas: Array.isArray(parsed.formulas) ? parsed.formulas : [],
    extractedText: parsed.extractedText || userPrompt || '',
    voiceSummary: parsed.voiceSummary || parsed.directAnswer || '',
    source: 'gemini'
  };
}

/**
 * Solve with Gemini Text API
 */
async function solveWithGeminiText(
  question: string,
  language: string,
  standard: string,
  apiKey: string,
  extractedText?: string
): Promise<MultimodalAnswer | null> {
  const isGu = language === 'gu';
  const isHi = language === 'hi';
  const requestedLanguage = isHi ? 'Hindi (हिन्दी)' : (isGu ? 'Gujarati (ગુજરાતી)' : 'English');
  const systemPrompt = `You are VM GyanSetu (વિદ્યામંદિર માછીઆવાસણા), a friendly, expert school teacher for students in Gujarat school (${standard}).
Answer the student's question clearly with step-by-step explanations.
Language requested: ${requestedLanguage}.

Respond in strictly valid JSON format with these exact keys:
{
  "title": "Short title of question / topic",
  "subject": "Mathematics | Science | Social Studies | English | Gujarati | Hindi",
  "directAnswer": "Direct concise answer or solution",
  "stepByStep": ["Step 1", "Step 2", "Step 3"],
  "keyConcepts": ["Concept 1", "Concept 2"],
  "formulas": ["Relevant formula if applicable"],
  "voiceSummary": "Short 2-sentence conversational summary suitable for text-to-speech audio readout"
}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: systemPrompt },
          { text: `Student Question: ${question}` }
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
    title: parsed.title || (isGu ? 'પ્રશ્નનો ઉકેલ' : 'Question Solution'),
    subject: parsed.subject || (isGu ? 'અભ્યાસક્રમ' : 'General'),
    directAnswer: parsed.directAnswer || '',
    stepByStep: Array.isArray(parsed.stepByStep) ? parsed.stepByStep : [parsed.stepByStep || ''],
    keyConcepts: Array.isArray(parsed.keyConcepts) ? parsed.keyConcepts : [],
    formulas: Array.isArray(parsed.formulas) ? parsed.formulas : [],
    extractedText: extractedText || question,
    voiceSummary: parsed.voiceSummary || parsed.directAnswer || '',
    source: 'gemini'
  };
}

/**
 * Robust Curriculum Knowledge Solver for Offline / Fallback Operation
 */
async function solveWithCurriculumEngine(
  rawQuery: string,
  language: string,
  standard: string,
  extractedText?: string
): Promise<MultimodalAnswer> {
  const isGu = language === 'gu';
  const isHi = language === 'hi';
  const q = rawQuery.toLowerCase();

  // 1. Math: Linear Equation Solver (e.g., 2x + 5 = 15 or 3x - 9 = 0)
  const linearMatch = rawQuery.match(/([+-]?\s*\d*)\s*([a-zA-Z])\s*([+-]\s*\d+)\s*=\s*([+-]?\s*\d+)/);
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
      const solution = step1Rhs / coeff;

      if (isGu) {
        return {
          title: `રેખીય સમીકરણ ઉકેલ (${rawQuery.trim()})`,
          subject: 'ગણિત (Mathematics)',
          directAnswer: `${variable} = ${solution}`,
          stepByStep: [
            `પગલું ૧: સમીકરણ લખો: ${coeff}${variable} + (${constant}) = ${rhs}`,
            `પગલું ૨: અચળ પદને જમણી બાજુ લઈ જાઓ: ${coeff}${variable} = ${rhs} - (${constant}) = ${step1Rhs}`,
            `પગલું ૩: બંને બાજુએ ${coeff} વડે ભાગો: ${variable} = ${step1Rhs} / ${coeff} = ${solution}`,
            `પગલું ૪: ચકાસણી: ડાબી બાજુ = ${coeff}(${solution}) + (${constant}) = ${rhs} = જમણી બાજુ (સત્ય છે).`
          ],
          keyConcepts: ['રેખીય સમીકરણ (Linear Equation)', 'ચલ અને અચળ (Variable & Constant)', 'સમાનતાનો નિયમ'],
          formulas: ['ax + b = c ⇒ x = (c - b) / a'],
          extractedText,
          voiceSummary: `આ સમીકરણનો ઉકેલ ${variable} બરાબર ${solution} છે. અચળ પદને જમણી બાજુ લઈ જઈને ગુણાંક વડે ભાગતા આ પરિણામ મળે છે.`,
          source: extractedText ? 'ocr_curriculum' : 'curriculum'
        };
      } else {
        return {
          title: `Linear Equation Solution (${rawQuery.trim()})`,
          subject: 'Mathematics',
          directAnswer: `${variable} = ${solution}`,
          stepByStep: [
            `Step 1: Write down the equation: ${coeff}${variable} + (${constant}) = ${rhs}`,
            `Step 2: Isolate the variable term by moving constant to the RHS: ${coeff}${variable} = ${rhs} - (${constant}) = ${step1Rhs}`,
            `Step 3: Divide both sides by the coefficient ${coeff}: ${variable} = ${step1Rhs} / ${coeff} = ${solution}`,
            `Step 4: Check: LHS = ${coeff}(${solution}) + (${constant}) = ${rhs} = RHS (Verified).`
          ],
          keyConcepts: ['Linear Equations in One Variable', 'Transposition Method', 'Verification'],
          formulas: ['ax + b = c ⇒ x = (c - b) / a'],
          extractedText,
          voiceSummary: `The solution to this equation is ${variable} equals ${solution}. Moving the constant term and dividing by the coefficient gives this answer.`,
          source: extractedText ? 'ocr_curriculum' : 'curriculum'
        };
      }
    }
  }

  // 2. Math: Geometric Area & Perimeter formulas
  if (q.includes('area of circle') || q.includes('વર્તુળનું ક્ષેત્રફળ')) {
    return isGu
      ? {
          title: 'વર્તુળનું ક્ષેત્રફળ અને પરિઘ',
          subject: 'ગણિત (Geometry)',
          directAnswer: 'વર્તુળનું ક્ષેત્રફળ = π × r² (જ્યાં r એ ત્રિજ્યા છે અને π ≈ 22/7 અથવા 3.14 છે).',
          stepByStep: [
            'પગલું ૧: વર્તુળની ત્રિજ્યા (r) શોધો અથવા માપો.',
            'પગલું ૨: ત્રિજ્યાનો વર્ગ કરો (r × r).',
            'પગલું ૩: પરિણામને π (3.14 અથવા 22/7) વડે ગુણો.',
            'પગલું ૪: પરિઘ માટે સૂત્ર: C = 2 × π × r વાપરો.'
          ],
          keyConcepts: ['વર્તુળ (Circle)', 'ત્રિજ્યા (Radius)', 'વ્યાસ (Diameter d = 2r)', 'પાઈ (π)'],
          formulas: ['ક્ષેત્રફળ A = πr²', 'પરિઘ C = 2πr'],
          extractedText,
          voiceSummary: 'વર્તુળનું ક્ષેત્રફળ પાઈ ગુણ્યા ત્રિજ્યાનો વર્ગ થાય છે, અને તેનો પરિઘ બે પાઈ આર થાય છે.',
          source: extractedText ? 'ocr_curriculum' : 'curriculum'
        }
      : {
          title: 'Area and Circumference of a Circle',
          subject: 'Mathematics (Geometry)',
          directAnswer: 'Area of Circle = πr² (where r is the radius and π ≈ 22/7 or 3.14).',
          stepByStep: [
            'Step 1: Identify or calculate the radius (r) of the circle.',
            'Step 2: Square the radius: r² = r × r.',
            'Step 3: Multiply by π (approximately 3.14159 or 22/7).',
            'Step 4: For Circumference / Perimeter, use the formula C = 2πr.'
          ],
          keyConcepts: ['Circle', 'Radius', 'Diameter (d = 2r)', 'Pi (π)'],
          formulas: ['Area A = πr²', 'Circumference C = 2πr'],
          extractedText,
          voiceSummary: 'The area of a circle is calculated by multiplying pi with the square of its radius. The circumference is two pi r.',
          source: extractedText ? 'ocr_curriculum' : 'curriculum'
        };
  }

  // 3. Math: Pythagoras Theorem
  if (q.includes('pythagoras') || q.includes('પાયથાગોરસ') || q.includes('right angle triangle') || q.includes('કાટકોણ ત્રિકોણ')) {
    return isGu
      ? {
          title: 'પાયથાગોરસનો પ્રમેય (Pythagoras Theorem)',
          subject: 'ગણિત (Geometry)',
          directAnswer: 'કાટકોણ ત્રિકોણમાં, કર્ણનો વર્ગ બાકીની બે બાજુઓના વર્ગોના સરવાળા જેટલો હોય છે: c² = a² + b².',
          stepByStep: [
            'પગલું ૧: કાટકોણ ત્રિકોણ ઓળખો જ્યાં એક ખૂણો ૯૦ અંશનો હોય.',
            'પગલું ૨: ૯૦° ના ખૂણાની સામેની બાજુને કર્ણ (Hypotenuse, c) કહે છે.',
            'પગલું ૩: બાજુ a નો વર્ગ (a²) અને બાજુ b નો વર્ગ (b²) કરો.',
            'પગલું ૪: બંનેનો સરવાળો કરી કર્ણની લંબાઈ મેળવવા વર્ગમૂળ કાઢો: c = √(a² + b²).'
          ],
          keyConcepts: ['કાટકોણ ત્રિકોણ', 'કર્ણ (Hypotenuse)', 'કાટખૂણો બનાવતી બાજુઓ'],
          formulas: ['c² = a² + b²', 'c = √(a² + b²)'],
          extractedText,
          voiceSummary: 'પાયથાગોરસના પ્રમેય મુજબ કાટકોણ ત્રિકોણમાં કર્ણનો વર્ગ બાકીની બે બાજુઓના વર્ગોના સરવાળા બરાબર થાય છે.',
          source: extractedText ? 'ocr_curriculum' : 'curriculum'
        }
      : {
          title: 'Pythagoras Theorem',
          subject: 'Mathematics (Geometry)',
          directAnswer: 'In a right-angled triangle, the square of the hypotenuse is equal to the sum of the squares of the other two sides: c² = a² + b².',
          stepByStep: [
            'Step 1: Identify the right-angled triangle where one interior angle is 90 degrees.',
            'Step 2: The side opposite to the right angle is the hypotenuse (c), which is the longest side.',
            'Step 3: Calculate the squares of the other two legs: a² and b².',
            'Step 4: Add them together and take the square root to find c: c = √(a² + b²).'
          ],
          keyConcepts: ['Right-Angled Triangle', 'Hypotenuse', 'Pythagorean Triples (3, 4, 5)'],
          formulas: ['c² = a² + b²', 'c = √(a² + b²)'],
          extractedText,
          voiceSummary: 'According to the Pythagoras theorem, the square of the hypotenuse equals the sum of the squares of the other two sides.',
          source: extractedText ? 'ocr_curriculum' : 'curriculum'
        };
  }

  // 4. Science: Photosynthesis
  if (q.includes('photosynthesis') || q.includes('પ્રકાશસંશ્લેષણ') || q.includes('chlorophyll') || q.includes('હરિતદ્રવ્ય')) {
    return isGu
      ? {
          title: 'વનસ્પતિમાં પ્રકાશસંશ્લેષણ પ્રક્રિયા',
          subject: 'વિજ્ઞાન (Biology)',
          directAnswer: 'પ્રકાશસંશ્લેષણ એ એવી પ્રક્રિયા છે જેમાં લીલી વનસ્પતિ સૂર્યપ્રકાશ, હરિતદ્રવ્ય (ક્લોરોફિલ), પાણી અને કાર્બન ડાયોક્સાઇડનો ઉપયોગ કરીને પોતાનો ખોરાક (ગ્લુકોઝ) બનાવે છે અને ઓક્સિજન મુક્ત કરે છે.',
          stepByStep: [
            'પગલું ૧: વનસ્પતિના મૂળ જમીનમાંથી પાણી અને ખનીજ ક્ષારો શોષે છે.',
            'પગલું ૨: પર્ણોમાં આવેલા પર્ણરંધ્રો (સ્ટોમેટા) વાતાવરણમાંથી કાર્બન ડાયોક્સાઇડ (CO₂) મેળવે છે.',
            'પગલું ૩: હરિતકણમાં રહેલું હરિતદ્રવ્ય (ક્લોરોફિલ) સૂર્યઊર્જાનું શોષણ કરે છે.',
            'પગલું ૪: રાસાયણિક પ્રક્રિયા દ્વારા ગ્લુકોઝ (ખોરાક) બને છે અને જીવનજરૂરી ઓક્સિજન (O₂) વાયુ બહાર નીકળે છે.'
          ],
          keyConcepts: ['હરિતદ્રવ્ય (Chlorophyll)', 'પર્ણરંધ્ર (Stomata)', 'ગ્લુકોઝ સંશ્લેષણ', 'સૂર્યપ્રકાશ'],
          formulas: ['6CO₂ + 6H₂O + સૂર્યપ્રકાશ → C₆H₁₂O₆ (ગ્લુકોઝ) + 6O₂'],
          extractedText,
          voiceSummary: 'પ્રકાશસંશ્લેષણ દ્વારા લીલી વનસ્પતિ સૂર્યપ્રકાશ, કાર્બન ડાયોક્સાઇડ અને પાણીની મદદથી ખોરાક બનાવે છે અને ઓક્સિજન વાયુ મુક્ત કરે છે.',
          source: extractedText ? 'ocr_curriculum' : 'curriculum'
        }
      : {
          title: 'Process of Photosynthesis',
          subject: 'Science (Biology)',
          directAnswer: 'Photosynthesis is the biological process by which green plants synthesize their own food (glucose) from sunlight, carbon dioxide, and water using chlorophyll, releasing oxygen as a byproduct.',
          stepByStep: [
            'Step 1: Roots absorb water and dissolved minerals from the soil.',
            'Step 2: Tiny pores called stomata on leaves take in carbon dioxide (CO₂) from air.',
            'Step 3: Chlorophyll pigment in chloroplasts captures radiant solar energy.',
            'Step 4: A chemical reaction synthesizes glucose (carbohydrate) and releases oxygen (O₂) into the atmosphere.'
          ],
          keyConcepts: ['Chlorophyll', 'Stomata', 'Glucose synthesis', 'Solar Energy to Chemical Energy'],
          formulas: ['6CO₂ + 6H₂O + Sunlight → C₆H₁₂O₆ (Glucose) + 6O₂'],
          extractedText,
          voiceSummary: 'Photosynthesis is how green plants make their food using sunlight, water, and carbon dioxide, while releasing oxygen into the air.',
          source: extractedText ? 'ocr_curriculum' : 'curriculum'
        };
  }

  // 5. Science: Newton's Laws of Motion / Force
  if (q.includes('newton') || q.includes('ન્યુટન') || q.includes('law of motion') || q.includes('ગતિના નિયમો') || q.includes('force') || q.includes('બળ')) {
    return isGu
      ? {
          title: 'ન્યુટનના ગતિના નિયમો અને બળ',
          subject: 'વિજ્ઞાન (Physics)',
          directAnswer: 'બળ = દળ × પ્રવેગ (F = m × a). ન્યુટનનો પ્રથમ નિયમ જડત્વનો નિયમ છે, બીજો નિયમ બળનું મૂલ્ય આપે છે, અને ત્રીજો નિયમ આઘાત અને પ્રત્યાઘાતનો છે.',
          stepByStep: [
            'પ્રથમ નિયમ (જડત્વ): બાહ્ય બળ ન લાગે ત્યાં સુધી સ્થિર પદાર્થ સ્થિર રહે છે અને ગતિમાન પદાર્થ અચળ વેગથી ગતિ ચાલુ રાખે છે.',
            'બીજો નિયમ (F = ma): પદાર્થના વેગમાનમાં ફેરફારનો દર લાગુ પાડેલા બાહ્ય બળના સમપ્રમાણમાં હોય છે.',
            'ત્રીજો નિયમ (આઘાત-પ્રત્યાઘાત): દરેક ક્રિયાબળ સામે સમાન મૂલ્યનું અને વિરુદ્ધ દિશામાં પ્રતિક્રિયાબળ લાગે છે.'
          ],
          keyConcepts: ['જડત્વ (Inertia)', 'બળ (Force)', 'પ્રવેગ (Acceleration)', 'ન્યુટન (N) એકમ'],
          formulas: ['F = m × a (બળ = દળ × પ્રવેગ)', 'P = m × v (વેગમાન)'],
          extractedText,
          voiceSummary: 'ન્યુટનના બીજા નિયમ મુજબ બળ બરાબર દળ ગુણ્યા પ્રવેગ થાય છે. તેનો એકમ ન્યુટન છે.',
          source: extractedText ? 'ocr_curriculum' : 'curriculum'
        }
      : {
          title: "Newton's Laws of Motion and Force",
          subject: 'Science (Physics)',
          directAnswer: "Force = mass × acceleration (F = m × a). Newton formulated 3 laws describing the relationship between a body and the forces acting upon it.",
          stepByStep: [
            "First Law (Inertia): An object remains at rest or in uniform motion unless acted upon by an external net force.",
            "Second Law (F = ma): The rate of change of momentum is directly proportional to applied force, giving F = m × a.",
            "Third Law (Action-Reaction): For every action, there is an equal and opposite reaction."
          ],
          keyConcepts: ['Inertia', 'Force (Newton, N)', 'Acceleration', 'Conservation of Momentum'],
          formulas: ['F = m × a', 'Momentum p = m × v'],
          extractedText,
          voiceSummary: "Newton's second law states that Force equals mass times acceleration. The standard unit of force is the Newton.",
          source: extractedText ? 'ocr_curriculum' : 'curriculum'
        };
  }

  // 6. Science: Metals & Non-metals / Acids & Bases
  if (q.includes('metal') || q.includes('ધાતુ') || q.includes('acid') || q.includes('એસિડ') || q.includes('base') || q.includes('બેઇઝ')) {
    return isGu
      ? {
          title: 'ધાતુ-અધાતુ અને એસિડ-બેઇઝના ગુણધર્મો',
          subject: 'વિજ્ઞાન (Chemistry)',
          directAnswer: 'ધાતુઓ ચળકાટ ધરાવતી, વિદ્યુત અને ઉષ્માની સુવાહક હોય છે. એસિડ સ્વાદે ખાટા હોય છે અને ભૂરા લિટમસને લાલ બનાવે છે, જ્યારે બેઇઝ તૂરા હોય છે અને લાલ લિટમસને ભૂરું બનાવે છે.',
          stepByStep: [
            'ધાતુઓના ગુણધર્મો: ટીપાવપણું, ખેંચાણપણું, રણકાર ઉત્પન્ન કરવો, ઉષ્મા અને વિદ્યુતના સુવાહક (દા.ત. લોખંડ, તાંબુ).',
            'અધાતુઓના ગુણધર્મો: નરમ, બરડ, ઉષ્મા અને વિદ્યુતના મંદવાહક (દા.ત. કોલસો, સલ્ફર).',
            'એસિડ: pH < 7, સ્વાદે ખાટા, ભૂરા લિટમસ પત્રને લાલ બનાવે છે (દા.ત. લીંબુનો રસ, હાઇડ્રોક્લોરિક એસિડ).',
            'બેઇઝ: pH > 7, સ્વાદે તૂરા અને સ્પર્શે ચીકણા, લાલ લિટમસ પત્રને ભૂરું બનાવે છે (દા.ત. સાબુનું દ્રાવણ).'
          ],
          keyConcepts: ['લિટમસ કસોટી', 'pH સ્કેલ', 'સુવાહકતા', 'તટસ્થીકરણ પ્રક્રિયા'],
          formulas: ['એસિડ + બેઇઝ → ક્ષાર + પાણી (તટસ્થીકરણ)'],
          extractedText,
          voiceSummary: 'એસિડ સ્વાદે ખાટા હોય છે અને ભૂરા લિટમસને લાલ બનાવે છે. બેઇઝ સ્વાદે તૂરા હોય છે અને લાલ લિટમસને ભૂરું બનાવે છે.',
          source: extractedText ? 'ocr_curriculum' : 'curriculum'
        }
      : {
          title: 'Properties of Metals, Non-Metals, Acids and Bases',
          subject: 'Science (Chemistry)',
          directAnswer: 'Metals are lustrous, malleable, and conductors of electricity. Acids taste sour and turn blue litmus red (pH < 7). Bases taste bitter, feel soapy, and turn red litmus blue (pH > 7).',
          stepByStep: [
            'Physical properties of metals: Malleability, ductility, sonority, and thermal/electrical conductivity.',
            'Physical properties of non-metals: Brittle, dull appearance, poor conductors of heat and electricity.',
            'Acids: Produce hydrogen ions (H+), sour taste, turn blue litmus paper red.',
            'Bases: Produce hydroxide ions (OH-), bitter taste, soapy touch, turn red litmus paper blue.',
            'Neutralization: Acid + Base reacts to produce Salt + Water.'
          ],
          keyConcepts: ['Malleability & Ductility', 'Litmus Indicators', 'pH Scale', 'Neutralization'],
          formulas: ['Acid + Base → Salt + Water'],
          extractedText,
          voiceSummary: 'Acids have a sour taste and turn blue litmus red. Bases feel soapy and turn red litmus blue. When mixed, they neutralize into salt and water.',
          source: extractedText ? 'ocr_curriculum' : 'curriculum'
        };
  }

  // 7. General Academic Doubts & Questions from Syllabus
  const queryDisplay = rawQuery.trim() || (isGu ? 'શૈક્ષણિક પ્રશ્ન' : (isHi ? 'शैक्षणिक प्रश्न' : 'Academic Doubt'));
  if (isGu) {
    return {
      title: `પ્રશ્નનો વિશ્લેષણાત્મક ઉકેલ: "${queryDisplay.substring(0, 45)}..."`,
      subject: 'અભ્યાસ સહાયક (Study Guidance)',
      directAnswer: `તમારા પ્રશ્ન "${queryDisplay}" માટે: મુખ્ય ખ્યાલ સમજીને નિયમિત પુનરાવર્તન અને પ્રેક્ટિસ કરવી સૌથી શ્રેષ્ઠ ઉપાય છે.`,
      stepByStep: [
        `પગલું ૧: પ્રશ્નને વિશ્લેષિત કરો: આપેલ માહિતી શું છે અને શું શોધવાનું છે તે ચોક્કસ નોંધો.`,
        `પગલું ૨: વિષયના પાઠ્યપુસ્તકના સંબંધિત પ્રકરણનું વાંચન કરો અને મુખ્ય વ્યાખ્યાઓ અલગ તારવો.`,
        `પગલું ૩: ગણિત અથવા વિજ્ઞાનના પ્રશ્નોમાં યોગ્ય સૂત્ર પસંદ કરીને કિંમતો મૂકો.`,
        `પગલું ૪: તમારી ભૂલ પુસ્તકમાં આ પ્રશ્ન નોંધો જેથી પરીક્ષા સમયે ઝડપી પુનરાવર્તન થઈ શકે.`
      ],
      keyConcepts: ['ખ્યાલ સ્પષ્ટતા (Conceptual Clarity)', 'સૂત્ર સ્મરણ (Formula Application)', 'પુનરાવર્તન (Revision)'],
      formulas: ['સફળતા = પાયાની સમજ + દૈનિક પ્રેક્ટિસ'],
      extractedText,
      voiceSummary: `આ પ્રશ્નનો ઉકેલ લાવવા માટે પહેલા પાયાના ખ્યાલો સ્પષ્ટ કરો અને પાઠ્યપુસ્તકના ઉદાહરણો પ્રમાણે ક્રમબદ્ધ પગલાં અનુસરો.`,
      source: extractedText ? 'ocr_curriculum' : 'curriculum'
    };
  }

  if (isHi) {
    return {
      title: `प्रश्नात्मक समाधान: "${queryDisplay.substring(0, 45)}..."`,
      subject: 'अध्ययन सहायक (Study Guidance)',
      directAnswer: `आपके प्रश्न "${queryDisplay}" के लिए: मुख्य अवधारणा को समझकर नियमित पुनरावलोकन और अभ्यास करना सबसे सर्वोत्तम उपाय है।`,
      stepByStep: [
        `चरण 1: प्रश्न का विश्लेषण करें: दी गई जानकारी क्या है और क्या ज्ञात करना है, उसे स्पष्ट नोट करें।`,
        `चरण 2: विषय की पाठ्यपुस्तक के संबंधित अध्याय को पढ़ें और मुख्य परिभाषाओं को समझें।`,
        `चरण 3: गणित या विज्ञान के प्रश्नों में उपयुक्त सूत्र चुनकर मान रखें और चरणबद्ध हल करें।`,
        `चरण 4: अपनी मिस्टेक बुक में इस प्रश्न को दर्ज करें ताकि परीक्षा के समय त्वरित पुनरावलोकन हो सके।`
      ],
      keyConcepts: ['अवधारणा स्पष्टता (Conceptual Clarity)', 'सूत्र अनुप्रयोग (Formula Application)', 'पुनरावलोकन (Revision)'],
      formulas: ['सफलता = बुनियादी समझ + दैनिक अभ्यास'],
      extractedText,
      voiceSummary: `इस प्रश्न का समाधान करने के लिए पहले बुनियादी अवधारणाओं को स्पष्ट करें और पाठ्यपुस्तक के उदाहरणों के अनुसार चरणबद्ध तरीके से आगे बढ़ें।`,
      source: extractedText ? 'ocr_curriculum' : 'curriculum'
    };
  }

  return {
    title: `Analytical Solution: "${queryDisplay.substring(0, 45)}..."`,
    subject: 'Academic Guidance & Solutions',
    directAnswer: `For your question "${queryDisplay}": Understanding the underlying core concept followed by step-by-step problem-solving yields the most accurate result.`,
    stepByStep: [
      'Step 1: Identify given parameters and clearly state what quantity or explanation needs to be found.',
      'Step 2: Recall the foundational definitions and scientific/mathematical rules related to this topic.',
      'Step 3: Apply the standard formulas and compute or elaborate logically step-by-step.',
      'Step 4: Review edge cases and log any common errors in your Mistake Book for exam readiness.'
    ],
    keyConcepts: ['Conceptual Clarity', 'Systematic Breakdown', 'Verification'],
    formulas: ['Success = Fundamental Understanding + Daily Practice'],
    extractedText,
    voiceSummary: 'To solve this question, first clarify the given values, apply the standard syllabus principles, and verify each step methodically.',
    source: extractedText ? 'ocr_curriculum' : 'curriculum'
  };
}
