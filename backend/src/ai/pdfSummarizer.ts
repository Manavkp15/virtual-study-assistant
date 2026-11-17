export interface SummarizedSection {
  heading: string;
  points: string[];
}

export interface KeyTermItem {
  term: string;
  definition: string;
}

export interface ExamQnAItem {
  question: string;
  answer: string;
  importance?: 'High' | 'Medium';
}

export interface PdfSummaryResponse {
  title: string;
  language: 'gu' | 'hi' | 'en';
  overview: string;
  keyTakeaways: string[];
  structuredNotes: SummarizedSection[];
  keyTerms: KeyTermItem[];
  importantFormulasOrRules: string[];
  examQuestions: ExamQnAItem[];
  speechSummary: string;
  source: 'gemini' | 'curriculum_nlp';
}

export interface PdfSummaryParams {
  text: string;
  fileName?: string;
  language?: 'gu' | 'hi' | 'en' | 'auto';
  detailLevel?: 'quick' | 'standard' | 'comprehensive';
  includeQnA?: boolean;
  includeGlossary?: boolean;
}

/**
 * Detect script language if not explicitly provided
 */
export function detectLang(text: string): 'gu' | 'hi' | 'en' {
  if (!text) return 'en';
  const guMatches = (text.match(/[\u0A80-\u0AFF]/g) || []).length;
  const hiMatches = (text.match(/[\u0900-\u097F]/g) || []).length;
  if (guMatches > 0 && guMatches >= hiMatches) return 'gu';
  if (hiMatches > 0 && hiMatches > guMatches) return 'hi';
  return 'en';
}

/**
 * Summarize PDF text using Gemini API if configured, otherwise fallback to local intelligent NLP
 */
export async function summarizePdfContent(params: PdfSummaryParams): Promise<PdfSummaryResponse> {
  const {
    text,
    fileName = 'Study_Material.pdf',
    language = 'auto',
    detailLevel = 'standard',
    includeQnA = true,
    includeGlossary = true
  } = params;

  const targetLang = (language === 'auto' || !language) ? detectLang(text) : language;
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  // Try Gemini generation if API key is provided
  if (apiKey && apiKey.length > 10) {
    try {
      const geminiResult = await summarizeWithGemini(
        text,
        fileName,
        targetLang,
        detailLevel,
        includeQnA,
        includeGlossary,
        apiKey
      );
      if (geminiResult) {
        return geminiResult;
      }
    } catch (err: any) {
      console.warn('[PdfSummarizer] Gemini summarization failed, falling back to local NLP:', err.message);
    }
  }

  // Fallback: Local rule-based & extractive NLP summarizer tailored for Gujarati & Indic curriculums
  return summarizeWithLocalNLP(text, fileName, targetLang, detailLevel, includeQnA, includeGlossary);
}

/**
 * Call Gemini API for pedagogical study summary & notes
 */
async function summarizeWithGemini(
  text: string,
  fileName: string,
  language: 'gu' | 'hi' | 'en',
  detailLevel: string,
  includeQnA: boolean,
  includeGlossary: boolean,
  apiKey: string
): Promise<PdfSummaryResponse | null> {
  const langName = language === 'gu' ? 'Gujarati (ગુજરાતી)' : (language === 'hi' ? 'Hindi (हिन्दी)' : 'English');

  const systemPrompt = `You are VM GyanSetu (વિદ્યામંદિર માછીઆવાસણા), a master school teacher creating high-yield revision notes and summaries from study PDF documents.
Target student audience: Primary and secondary school students.
Language: Strictly generate all output in ${langName}. Preserve technical vocabulary in ${langName}.
Detail Level requested: ${detailLevel}.

Analyze the text extracted from the document "${fileName}" and produce an organized study package.
Respond strictly with valid JSON conforming to this exact structure:
{
  "title": "Clear concise title of the chapter / document in ${langName}",
  "overview": "Comprehensive 3-4 sentence overview of the core concepts in ${langName}",
  "keyTakeaways": [
    "Crucial takeaway point 1",
    "Crucial takeaway point 2",
    "Crucial takeaway point 3",
    "Crucial takeaway point 4"
  ],
  "structuredNotes": [
    {
      "heading": "Section / Concept Name in ${langName}",
      "points": [
        "Concise revision note 1",
        "Concise revision note 2",
        "Concise revision note 3"
      ]
    }
  ],
  "keyTerms": [
    {
      "term": "Term or concept name in ${langName}",
      "definition": "Clear, student-friendly definition in ${langName}"
    }
  ],
  "importantFormulasOrRules": [
    "Relevant formula, unit (SI unit), or scientific law"
  ],
  "examQuestions": [
    {
      "question": "High-probability exam question on this chapter in ${langName}?",
      "answer": "Accurate, model answer in ${langName} that students can memorize",
      "importance": "High"
    }
  ],
  "speechSummary": "A smooth, natural 3-sentence summary in ${langName} optimized for text-to-speech audio readout aloud."
}`;

  const truncatedText = text.length > 15000 ? text.slice(0, 15000) + '...' : text;

  const payload = {
    contents: [
      {
        parts: [
          { text: systemPrompt },
          { text: `Document content:\n${truncatedText}` }
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

  if (!response.ok) {
    throw new Error(`Gemini API HTTP ${response.status}`);
  }

  const data: any = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) return null;

  try {
    const parsed = JSON.parse(rawText);
    return {
      title: parsed.title || fileName.replace(/\.pdf$/i, ''),
      language,
      overview: parsed.overview || '',
      keyTakeaways: Array.isArray(parsed.keyTakeaways) ? parsed.keyTakeaways : [],
      structuredNotes: Array.isArray(parsed.structuredNotes) ? parsed.structuredNotes : [],
      keyTerms: Array.isArray(parsed.keyTerms) ? parsed.keyTerms : [],
      importantFormulasOrRules: Array.isArray(parsed.importantFormulasOrRules) ? parsed.importantFormulasOrRules : [],
      examQuestions: Array.isArray(parsed.examQuestions) ? parsed.examQuestions : [],
      speechSummary: parsed.speechSummary || parsed.overview || '',
      source: 'gemini'
    };
  } catch (err) {
    console.warn('[PdfSummarizer] JSON parse error from Gemini output:', err);
    return null;
  }
}

/**
 * Robust Local Extractive NLP & Heuristic Summarizer
 * Specifically tuned for Gujarati (ગુજરાતી), Hindi (हिन्दी), and English academic text.
 */
function summarizeWithLocalNLP(
  text: string,
  fileName: string,
  language: 'gu' | 'hi' | 'en',
  detailLevel: string,
  includeQnA: boolean,
  includeGlossary: boolean
): PdfSummaryResponse {
  const isGu = language === 'gu';
  const isHi = language === 'hi';

  const cleanText = text
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[#*_`~[\]]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();

  // 1. Split text into logical lines / paragraphs first
  const rawBlocks = cleanText
    .split(/\n+/)
    .map(b => b.trim())
    .filter(Boolean);

  // 2. Expand blocks into sentences and bullet items
  const sentences: string[] = [];
  for (const block of rawBlocks) {
    // Split sentences using full stop punctuation: periods, Indic dandas (।, ॥), exclamation, question marks
    const subSentences = block
      .split(/(?<=[.!?।॥])\s+/)
      .map(s => s.trim())
      .filter(s => s.length >= 6); // Allow concise Gujarati terms and bullet items!

    if (subSentences.length > 0) {
      sentences.push(...subSentences);
    } else if (block.length >= 6) {
      sentences.push(block);
    }
  }

  // Derive document title in Gujarati or target language
  let baseName = fileName.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ');
  let title = '';
  if (sentences.length > 0 && sentences[0].length < 80 && !sentences[0].includes('.')) {
    title = sentences[0].replace(/^[૦-૯0-9.\-\s]+/, '').trim();
  } else if (isGu) {
    title = `અભ્યાસ સારાંશ: ${baseName}`;
  } else if (isHi) {
    title = `अध्ययन सारांश: ${baseName}`;
  } else {
    title = `Study Summary: ${baseName}`;
  }

  // 3. Extract Definitions and Key Terms with Gujarati pattern support
  const keyTerms: KeyTermItem[] = [];
  const importantFormulasOrRules: string[] = [];
  const processedTerms = new Set<string>();

  for (const s of sentences) {
    if (isGu) {
      // Pattern 1: [Term] એટલે [Definition]
      if (s.includes(' એટલે ')) {
        const parts = s.split(/ એટલે /);
        if (parts.length >= 2) {
          const term = parts[0].replace(/^[૦-૯0-9.\-\s()]+/, '').trim();
          const def = parts.slice(1).join(' ').trim();
          if (term.length > 1 && term.length < 35 && !processedTerms.has(term)) {
            processedTerms.add(term);
            keyTerms.push({ term, definition: def });
          }
        }
      }
      // Pattern 2: [Term]: [Definition] or [Term] - [Definition]
      else if (s.includes(':') || s.includes(' - ') || s.includes(' : ')) {
        const parts = s.split(/:\s*|\s+-\s+|\s+:\s+/);
        if (parts.length >= 2) {
          const term = parts[0].replace(/^[૦-૯0-9.\-\s()]+/, '').trim();
          const def = parts.slice(1).join(' ').trim();
          if (term.length > 1 && term.length < 35 && def.length > 8 && !processedTerms.has(term)) {
            processedTerms.add(term);
            keyTerms.push({ term, definition: def });
          }
        }
      }
      // Pattern 3: ...ને [Term] કહે છે / કહેવાય છે / કહેવામાં આવે છે
      else if (s.includes('કહે છે') || s.includes('કહેવાય છે') || s.includes('કહેવામાં આવે છે')) {
        const match = s.match(/(.+?)ને\s+([^\s]+(?:\s+[^\s]+)?)\s+કહે/);
        if (match) {
          const term = match[2].trim();
          const def = match[1].trim();
          if (term.length > 1 && term.length < 35 && !processedTerms.has(term)) {
            processedTerms.add(term);
            keyTerms.push({ term, definition: `${def}ને ${term} કહે છે.` });
          }
        }
      }

      // Gujarati Formulas & Units
      if (
        s.includes('=') ||
        s.includes('સૂત્ર') ||
        s.includes('પાસ્કલ') ||
        s.includes('ન્યૂટન') ||
        s.includes('SI એકમ') ||
        s.includes('નિયમ') ||
        s.includes('મીટર') ||
        s.includes('કિગ્રા')
      ) {
        importantFormulasOrRules.push(s);
      }
    } else if (isHi) {
      // Hindi Patterns
      if (s.includes(' अर्थात् ') || s.includes(' अर्थात ') || s.includes(' यानी ')) {
        const parts = s.split(/ अर्थात् | अर्थात | यानी /);
        if (parts.length >= 2) {
          const term = parts[0].replace(/^[०-९0-9.\-\s()]+/, '').trim();
          const def = parts.slice(1).join(' ').trim();
          if (term.length > 1 && term.length < 35 && !processedTerms.has(term)) {
            processedTerms.add(term);
            keyTerms.push({ term, definition: def });
          }
        }
      } else if (s.includes(':') || s.includes(' - ')) {
        const parts = s.split(/:\s*|\s+-\s+/);
        if (parts.length >= 2) {
          const term = parts[0].replace(/^[०-९0-9.\-\s()]+/, '').trim();
          const def = parts.slice(1).join(' ').trim();
          if (term.length > 1 && term.length < 35 && def.length > 8 && !processedTerms.has(term)) {
            processedTerms.add(term);
            keyTerms.push({ term, definition: def });
          }
        }
      } else if (s.includes('कहते हैं') || s.includes('कहा जाता है')) {
        const match = s.match(/(.+?)को\s+([^\s]+(?:\s+[^\s]+)?)\s+कह/);
        if (match) {
          const term = match[2].trim();
          const def = match[1].trim();
          if (term.length > 1 && term.length < 35 && !processedTerms.has(term)) {
            processedTerms.add(term);
            keyTerms.push({ term, definition: `${def} को ${term} कहते हैं।` });
          }
        }
      }

      if (
        s.includes('=') ||
        s.includes('सूत्र') ||
        s.includes('पास्कल') ||
        s.includes('न्यूटन') ||
        s.includes('मात्रक') ||
        s.includes('नियम')
      ) {
        importantFormulasOrRules.push(s);
      }
    } else {
      // English Patterns
      if (s.includes(' is defined as ') || s.includes(' refers to ') || s.includes(' is called ')) {
        const parts = s.split(/ is defined as | refers to | is called /i);
        if (parts.length >= 2) {
          const term = parts[0].replace(/^[0-9.\-\s()]+/, '').trim();
          const def = parts.slice(1).join(' ').trim();
          if (term.length > 1 && term.length < 35 && !processedTerms.has(term)) {
            processedTerms.add(term);
            keyTerms.push({ term, definition: def });
          }
        }
      } else if (s.includes(':') || s.includes(' - ')) {
        const parts = s.split(/:\s*|\s+-\s+/);
        if (parts.length >= 2) {
          const term = parts[0].replace(/^[0-9.\-\s()]+/, '').trim();
          const def = parts.slice(1).join(' ').trim();
          if (term.length > 1 && term.length < 35 && def.length > 8 && !processedTerms.has(term)) {
            processedTerms.add(term);
            keyTerms.push({ term, definition: def });
          }
        }
      }

      if (
        s.includes('=') ||
        s.toLowerCase().includes('si unit') ||
        s.toLowerCase().includes('law of') ||
        s.toLowerCase().includes('formula')
      ) {
        importantFormulasOrRules.push(s);
      }
    }
  }

  // 4. Key Takeaways: High-information sentences
  const takeawayCount = detailLevel === 'quick' ? 4 : (detailLevel === 'comprehensive' ? 8 : 6);
  const meaningfulSentences = sentences.filter(s => s.length > 15);
  const keyTakeaways = (meaningfulSentences.length > 0 ? meaningfulSentences : sentences).slice(0, takeawayCount);

  // 5. Executive Overview Paragraph
  let overview = '';
  if (keyTakeaways.length >= 3) {
    overview = keyTakeaways.slice(0, 3).join(' ');
  } else if (keyTakeaways.length > 0) {
    overview = keyTakeaways.join(' ');
  } else {
    overview = isGu
      ? 'આ દસ્તાવેજમાં પ્રકરણના મૂળભૂત ખ્યાલો અને મહત્વના નિયમો સમજાવવામાં આવ્યા છે.'
      : (isHi ? 'इस दस्तावेज़ में अध्याय की मुख्य अवधारणाओं और नियमों को समझाया गया है।' : 'This document outlines key chapter concepts and foundational principles.');
  }

  // 6. Sectioned Revision Notes
  const structuredNotes: SummarizedSection[] = [];
  const chunkSize = detailLevel === 'quick' ? 3 : 4;
  const sectionsSource = sentences.filter(s => s.length > 10);

  const guHeadings = [
    'મુખ્ય ખ્યાલો અને વ્યાખ્યાઓ',
    'પ્રકારો અને મહત્વપૂર્ણ વર્ગીકરણ',
    'નિયમો અને વૈજ્ઞાનિક સિદ્ધાંતો',
    'વ્યવહારુ ઉપયોગો અને ઉદાહરણો',
    'પરીક્ષા લક્ષી પુનરાવર્તન'
  ];

  const hiHeadings = [
    'मुख्य अवधारणाएँ और परिभाषाएँ',
    'प्रकार और वर्गीकरण',
    'नियम और वैज्ञानिक सिद्धांत',
    'व्यावहारिक उपयोग और उदाहरण',
    'परीक्षा पुनरीक्षण'
  ];

  const enHeadings = [
    'Core Concepts and Definitions',
    'Classifications and Types',
    'Rules and Scientific Principles',
    'Practical Applications and Examples',
    'Exam Revision Takeaways'
  ];

  const headingsList = isGu ? guHeadings : (isHi ? hiHeadings : enHeadings);

  for (let i = 0; i < sectionsSource.length; i += chunkSize) {
    const chunk = sectionsSource.slice(i, i + chunkSize);
    if (chunk.length === 0) continue;
    const hIdx = structuredNotes.length % headingsList.length;
    const prefix = isGu ? `વિભાગ ${structuredNotes.length + 1}: ` : (isHi ? `अनुभाग ${structuredNotes.length + 1}: ` : `Section ${structuredNotes.length + 1}: `);

    structuredNotes.push({
      heading: prefix + headingsList[hIdx],
      points: chunk
    });
    if (structuredNotes.length >= 5) break;
  }

  // 7. Generate High-Yield Exam Q&A
  const examQuestions: ExamQnAItem[] = [];
  if (keyTerms.length > 0) {
    for (const kt of keyTerms.slice(0, 5)) {
      examQuestions.push({
        question: isGu
          ? `${kt.term} એટલે શું? તેની વ્યાખ્યા અને મહત્વ સમજાવો.`
          : (isHi ? `${kt.term} से क्या अभिप्राय है? इसकी परिभाषा और महत्व स्पष्ट कीजिए।` : `What is ${kt.term}? Explain its definition and significance.`),
        answer: kt.definition,
        importance: 'High'
      });
    }
  }

  // If few key terms found, generate questions from takeaways
  if (examQuestions.length < 3 && keyTakeaways.length >= 2) {
    examQuestions.push({
      question: isGu
        ? 'આ પ્રકરણની મુખ્ય વિભાવનાઓ કઈ છે?'
        : (isHi ? 'इस अध्याय की मुख्य अवधारणाएँ कौन-सी हैं?' : 'What are the core concepts covered in this chapter?'),
      answer: keyTakeaways.slice(0, 2).join(' '),
      importance: 'High'
    });
    if (keyTakeaways.length >= 3) {
      examQuestions.push({
        question: isGu
          ? 'આ સિદ્ધાંતના વ્યવહારુ ઉદાહરણો આપો.'
          : (isHi ? 'इस सिद्धांत के व्यावहारिक अनुप्रयोग समझाइए।' : 'Describe the practical applications of this principle.'),
        answer: keyTakeaways[2],
        importance: 'Medium'
      });
    }
  }

  // 8. Natural Speech Summary for Gujarati/Indic TTS Readout
  const speechSummary = isGu
    ? `અભ્યાસ સારાંશ: ${keyTakeaways.slice(0, 2).join(' ')} વધુ વિગત માટે રિવિઝન નોટ્સ તપાસો.`
    : (isHi
      ? `अध्ययन सारांश: ${keyTakeaways.slice(0, 2).join(' ')} विस्तृत जानकारी के लिए नोट्स देखें।`
      : `Study summary: ${keyTakeaways.slice(0, 2).join(' ')} Check the revision notes for details.`);

  return {
    title,
    language,
    overview,
    keyTakeaways,
    structuredNotes,
    keyTerms: keyTerms.slice(0, 6),
    importantFormulasOrRules: importantFormulasOrRules.slice(0, 5),
    examQuestions: examQuestions.slice(0, 5),
    speechSummary,
    source: 'curriculum_nlp'
  };
}
