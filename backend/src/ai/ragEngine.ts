import { prisma } from '../database/prisma';

export interface TextbookCitation {
  id: string;
  documentId: string;
  textbookTitle: string;
  board: string;
  standard: string;
  subject: string;
  medium: string;
  chapterName: string;
  chapterNumber?: number | null;
  pageNumber: number;
  excerpt: string;
  score: number;
}

export interface RAGAnswerResult {
  question: string;
  answer: string;
  isGrounded: boolean;
  relevanceScore: number;
  board?: string;
  citations: TextbookCitation[];
  groundingStatus: 'VERIFIED' | 'NOT_FOUND' | 'INSUFFICIENT_EVIDENCE';
}

interface RAGQueryParams {
  question: string;
  board?: string; // 'NCERT' | 'GSEB' | 'ALL'
  standard?: string; // 'Standard 6' | 'Standard 7' | 'Standard 8' | 'ALL'
  subject?: string;
  medium?: string;
  language?: string; // 'en' | 'gu' | 'hi'
}

// Common Stop Words (English, Gujarati) to filter out non-informative words from semantic scoring
const STOP_WORDS = new Set([
  // English Stopwords
  'the', 'is', 'are', 'was', 'were', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'with',
  'a', 'an', 'of', 'by', 'from', 'about', 'into', 'over', 'after', 'beneath', 'under',
  'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how', 'all', 'any',
  'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should',
  'now', 'give', 'gives', 'tell', 'me', 'please', 'explain', 'describe', 'definition', 'define',
  'their', 'they', 'them', 'these', 'those', 'this', 'that', 'there', 'here', 'its',
  // Gujarati Stopwords & Question Prompts
  'અને', 'કે', 'છે', 'હતો', 'હતી', 'હતા', 'હશે', 'માટે', 'પર', 'થી', 'દ્વારા', 'માં',
  'આ', 'તે', 'એ', 'જે', 'તેમ', 'નથી', 'હોય', 'કરવું', 'કરે', 'કરી', 'શકે', 'આપો', 'શું',
  'કઈ', 'કયો', 'કયા', 'કેટલા', 'કેવી', 'રીતે', 'જણાવો', 'સમજાવો', 'લખો', 'એટલે', 'વ્યાખ્યા', 'વિશે'
]);

/**
 * Generates a normalized semantic vector (term frequencies + sublinear scaling + n-grams)
 * supporting both English and Gujarati scripts without external network dependency.
 */
export function generateSemanticVector(text: string): Record<string, number> {
  const normalized = text.toLowerCase().replace(/[^\w\s\u0A80-\u0AFF\u0900-\u097F]/g, ' ');
  const words = normalized.split(/\s+/).filter(w => w.length > 1);

  const freqMap: Record<string, number> = {};

  // Word-level features (filtering non-informative stopwords)
  for (const word of words) {
    if (STOP_WORDS.has(word)) continue;
    freqMap[word] = (freqMap[word] || 0) + 1;

    // Character 3-grams for morphological inflection handling
    if (word.length >= 4) {
      for (let i = 0; i <= word.length - 3; i++) {
        const trigram = `_3_${word.substring(i, i + 3)}`;
        freqMap[trigram] = (freqMap[trigram] || 0) + 0.35;
      }
    }
  }

  // L2 unit vector normalization
  let sumSquares = 0;
  for (const key of Object.keys(freqMap)) {
    const val = 1 + Math.log(freqMap[key]);
    freqMap[key] = val;
    sumSquares += val * val;
  }

  const norm = Math.sqrt(sumSquares) || 1;
  const vector: Record<string, number> = {};
  for (const key of Object.keys(freqMap)) {
    vector[key] = Number((freqMap[key] / norm).toFixed(4));
  }

  return vector;
}

/**
 * Calculates cosine similarity between query vector and stored chunk vector
 */
export function calculateCosineSimilarity(
  vecA: Record<string, number>,
  vecB: Record<string, number>
): number {
  let dotProduct = 0;
  for (const key of Object.keys(vecA)) {
    if (vecB[key]) {
      dotProduct += vecA[key] * vecB[key];
    }
  }
  return Math.min(1.0, Math.max(0, dotProduct));
}

/**
 * Calculates lexical keyword overlap ratio supporting Indic inflectional stems
 */
export function calculateKeywordOverlap(query: string, text: string): number {
  const qTokens = query
    .toLowerCase()
    .replace(/[^\w\s\u0A80-\u0AFF\u0900-\u097F]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2 && !STOP_WORDS.has(w));

  if (qTokens.length === 0) return 0;

  const docTextLower = text.toLowerCase();
  let matches = 0;
  for (const token of qTokens) {
    if (docTextLower.includes(token)) {
      matches++;
      continue;
    }
    // Indic morphological stem matching (e.g. દબાણની -> દબાણ, પ્રકાશસંશ્લેષણનું -> પ્રકાશસંશ્લેષણ)
    if (token.length >= 3) {
      const stem1 = token.slice(0, -1);
      const stem2 = token.slice(0, -2);
      if (docTextLower.includes(stem1) || (stem2.length >= 2 && docTextLower.includes(stem2))) {
        matches++;
        continue;
      }
    }
  }
  return matches / qTokens.length;
}

/**
 * Chunks a large text block into overlapping segments preserving sentence boundaries
 */
export function chunkTextContent(
  fullText: string,
  maxChunkSize: number = 600,
  overlap: number = 100
): string[] {
  const clean = fullText.replace(/\r\n/g, '\n').trim();
  const sentences = clean.split(/(?<=[.?!:\n])\s+/).filter(s => s.trim().length > 0);

  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChunkSize) {
      if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
      }
      // Retain overlap from end of previous chunk
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.min(words.length, Math.floor(overlap / 10))).join(' ');
      currentChunk = overlapWords + ' ' + sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Ensures authorized NCERT and Gujarat Board seed textbooks exist in database
 */
export async function ensureSeedTextbooksExist(): Promise<void> {
  const count = await prisma.textbookDocument.count();
  if (count > 0) return;

  console.log('📚 Initializing authorized NCERT & Gujarat Board Textbook Knowledge Base...');

  const initialBooks = [
    // 1. NCERT Class 8 Science - Force and Pressure
    {
      title: 'NCERT Class 8 Science - Chapter 11: Force and Pressure',
      titleGu: 'NCERT ધોરણ ૮ વિજ્ઞાન - પ્રકરણ ૧૧: બળ અને દબાણ',
      board: 'NCERT',
      standard: 'Standard 8',
      subject: 'Science',
      medium: 'English',
      academicYear: '2025-2026',
      chapterNumber: 11,
      chapterName: 'Force and Pressure',
      chunks: [
        {
          page: 128,
          content:
            'A force is an interaction between objects resulting in a push or a pull. Actions like opening a door, hitting a ball, lifting a bag, or pressing a sponge involve applying force. A force can change the state of motion of an object from rest to moving, or alter its speed and direction of travel. Forces have both magnitude and direction.'
        },
        {
          page: 130,
          content:
            'Contact forces require physical touch between objects. Examples include Muscular Force (produced by body muscles) and Friction (a force opposing relative motion between two surfaces in contact). Non-contact forces act from a distance without touching, such as Magnetic Force, Electrostatic Force, and Gravitational Force. Gravity is an attractive force exerted by the Earth on all objects.'
        },
        {
          page: 134,
          content:
            'Pressure is defined as the force acting per unit area of a surface: Pressure = Force / Area. When a force acts on a smaller area, it exerts greater pressure. This is why nails have sharp pointed tips and school bags have wide shoulder straps to reduce pressure on the shoulders. The SI unit of pressure is Pascal (Pa), equivalent to one Newton per square meter (N/m²).'
        },
        {
          page: 138,
          content:
            'Liquids and gases also exert pressure on the walls of their containers. Liquid pressure increases with depth; the pressure at the bottom of a water tank is higher than at the top. The envelope of air surrounding the Earth is called the atmosphere, and the pressure exerted by this atmospheric air is called Atmospheric Pressure. At sea level, atmospheric pressure is roughly 101.3 kilopascals.'
        }
      ]
    },

    // 2. Gujarat Board (GSEB) Class 8 Science - Force and Pressure (Gujarati Medium)
    {
      title: 'ગુજરાત રાજ્ય શાળા પાઠ્યપુસ્તક મંડળ (GSEB) ધોરણ ૮ વિજ્ઞાન - પ્રકરણ ૧૧: બળ અને દબાણ',
      titleGu: 'GSEB ધોરણ ૮ વિજ્ઞાન - પ્રકરણ ૧૧: બળ અને દબાણ',
      board: 'GSEB',
      standard: 'Standard 8',
      subject: 'Science',
      medium: 'Gujarati',
      academicYear: '2025-2026',
      chapterNumber: 11,
      chapterName: 'બળ અને દબાણ',
      chunks: [
        {
          page: 125,
          content:
            'વિજ્ઞાનમાં પદાર્થ પર લાગતા ધક્કા કે ખેંચાણને "બળ" (Force) કહે છે. જ્યારે બે પદાર્થો વચ્ચે આંતરક્રિયા થાય ત્યારે જ બળ અસ્તિત્વમાં આવે છે. બળ લગાડવાથી સ્થિર પદાર્થ ગતિમાં આવી શકે છે, ગતિમાન પદાર્થની ઝડપ બદલાઈ શકે છે અથવા તેની દિશા બદલાઈ શકે છે. બળને મૂલ્ય અને દિશા બંને હોય છે.'
        },
        {
          page: 129,
          content:
            'સંપર્ક બળ (Contact Force): જે બળોમાં બે પદાર્થો વચ્ચે ભૌતિક સંપર્ક જરૂરી હોય તેને સંપર્ક બળ કહેવાય છે. દાખલા તરીકે, સ્નાયુબળ અને ઘર્ષણબળ. અસંપર્ક બળ (Non-Contact Force): જે બળોમાં પદાર્થો સંપર્કમાં ન હોવા છતાં બળ લાગે છે, જેમ કે ચુંબકીય બળ, સ્થિત વિદ્યુતબળ અને ગુરુત્વાકર્ષણ બળ. પૃથ્વી દરેક પદાર્થને પોતાની તરફ ખેંચે છે તેને ગુરુત્વાકર્ષણ બળ કહે છે.'
        },
        {
          page: 133,
          content:
            'દબાણ (Pressure): એકમ ક્ષેત્રફળ દીઠ સપાટી પર લંબરૂપે લાગતા બળને દબાણ કહે છે. સૂત્ર: દબાણ = બળ / ક્ષેત્રફળ (P = F / A). ક્ષેત્રફળ જેટલું ઓછું હોય, તેટલું જ આપેલા બળનું દબાણ વધારે હોય છે. આથી જ ખીલીની અણી તીક્ષ્ણ રાખવામાં આવે છે અને સ્કૂલ બેગના પટ્ટા પહોળા રાખવામાં આવે છે જેથી ખભા પર દબાણ ઘટે. દબાણનો એકમ ન્યૂટન/મીટર² અથવા પાસ્કલ (Pa) છે.'
        },
        {
          page: 137,
          content:
            'પ્રવાહી અને વાયુઓ પણ જે પાત્રમાં ભરવામાં આવે તેની દીવાલો પર દબાણ લગાડે છે. પ્રવાહીમાં ઊંડાઈ વધવાની સાથે દબાણ વધે છે. આપણી આસપાસ રહેલા હવાના આવરણને વાતાવરણ કહે છે અને વાતાવરણની હવા જે દબાણ કરે છે તેને વાતાવરણીય દબાણ (Atmospheric Pressure) કહેવાય છે.'
        }
      ]
    },

    // 3. NCERT Class 8 Mathematics - Linear Equations
    {
      title: 'NCERT Class 8 Mathematics - Chapter 2: Linear Equations in One Variable',
      titleGu: 'NCERT ધોરણ ૮ ગણિત - પ્રકરણ ૨: એકચલ સુરેખ સમીકરણ',
      board: 'NCERT',
      standard: 'Standard 8',
      subject: 'Mathematics',
      medium: 'English',
      academicYear: '2025-2026',
      chapterNumber: 2,
      chapterName: 'Linear Equations in One Variable',
      chunks: [
        {
          page: 21,
          content:
            'An algebraic equation is an equality involving variables and constants. A linear equation in one variable is an equation where the highest exponent of the single variable is 1. The general form is ax + b = c, where a is not equal to zero. In an equation, the expression on the left of the equality sign is called the Left Hand Side (LHS) and on the right is the Right Hand Side (RHS).'
        },
        {
          page: 24,
          content:
            'To solve a linear equation, any term can be transposed from one side to the other by changing its sign: positive becomes negative, and negative becomes positive. Similarly, multiplication becomes division and division becomes multiplication across the equality sign. Both sides must be balanced by applying the identical mathematical operation to maintain equality.'
        }
      ]
    },

    // 4. Gujarat Board (GSEB) Class 8 Mathematics - Linear Equations (Gujarati Medium)
    {
      title: 'ગુજરાત રાજ્ય શાળા પાઠ્યપુસ્તક મંડળ (GSEB) ધોરણ ૮ ગણિત - પ્રકરણ ૨: એકચલ સુરેખ સમીકરણ',
      titleGu: 'GSEB ધોરણ ૮ ગણિત - પ્રકરણ ૨: એકચલ સુરેખ સમીકરણ',
      board: 'GSEB',
      standard: 'Standard 8',
      subject: 'Mathematics',
      medium: 'Gujarati',
      academicYear: '2025-2026',
      chapterNumber: 2,
      chapterName: 'એકચલ સુરેખ સમીકરણ',
      chunks: [
        {
          page: 19,
          content:
            'જે સમીકરણમાં એક જ ચલ હોય અને તે ચલની મહત્તમ ઘાત ૧ હોય, તેવા સમીકરણને એકચલ સુરેખ સમીકરણ (Linear Equation in One Variable) કહે છે. ઉદાહરણ તરીકે: 2x - 3 = 7. આમાં બરાબર (=) ના ચિહ્નની ડાબી બાજુને ડા.બા. (LHS) અને જમણી બાજુને જ.બા. (RHS) કહે છે.'
        },
        {
          page: 23,
          content:
            'એકચલ સુરેખ સમીકરણનો ઉકેલ શોધવા માટે ચલને એક બાજુ રાખીને અચળ પદોનું પક્ષાંતર કરવામાં આવે છે. પક્ષાંતર કરતી વખતે ચિહ્ન બદલાય છે: સરવાળો બાદબાકીમાં અને ગુણાકાર ભાગાકારમાં ફેરવાય છે. બંને બાજુ સમાન ગાણિતિક ક્રિયા કરવાથી સમીકરણની સમાનતા જળવાય છે.'
        }
      ]
    },

    // 5. NCERT Class 7 Science - Photosynthesis
    {
      title: 'NCERT Class 7 Science - Chapter 1: Nutrition in Plants',
      titleGu: 'NCERT ધોરણ ૭ વિજ્ઞાન - પ્રકરણ ૧: વનસ્પતિમાં પોષણ',
      board: 'NCERT',
      standard: 'Standard 7',
      subject: 'Science',
      medium: 'English',
      academicYear: '2025-2026',
      chapterNumber: 1,
      chapterName: 'Nutrition in Plants',
      chunks: [
        {
          page: 1,
          content:
            'Nutrition is the mode of taking food by an organism and its utilization by the body. Green plants synthesize their own food using simple chemical substances like carbon dioxide, water, and minerals. Hence, plants are called Autotrophs (auto = self, trophos = nourishment). Humans and animals depend on plants directly or indirectly, hence called Heterotrophs.'
        },
        {
          page: 3,
          content:
            'Photosynthesis is the process by which green plants prepare their own food in the presence of sunlight, chlorophyll, carbon dioxide, and water. Leaves are the food factories of plants. Carbon dioxide from air is taken in through tiny pores called Stomata present on the surface of leaves, guarded by guard cells. Chlorophyll is the green pigment in leaves that captures solar energy.'
        },
        {
          page: 4,
          content:
            'Equation of Photosynthesis: Carbon dioxide + Water (in the presence of Sunlight and Chlorophyll) gives Carbohydrate (Glucose) + Oxygen. Oxygen released during photosynthesis is essential for the survival of all living organisms. The carbohydrates produced are ultimately converted into starch for storage.'
        }
      ]
    },

    // 6. Gujarat Board (GSEB) Class 7 Science - Photosynthesis (Gujarati Medium)
    {
      title: 'ગુજરાત રાજ્ય શાળા પાઠ્યપુસ્તક મંડળ (GSEB) ધોરણ ૭ વિજ્ઞાન - પ્રકરણ ૧: વનસ્પતિમાં પોષણ',
      titleGu: 'GSEB ધોરણ ૭ વિજ્ઞાન - પ્રકરણ ૧: વનસ્પતિમાં પોષણ',
      board: 'GSEB',
      standard: 'Standard 7',
      subject: 'Science',
      medium: 'Gujarati',
      academicYear: '2025-2026',
      chapterNumber: 1,
      chapterName: 'વનસ્પતિમાં પોષણ',
      chunks: [
        {
          page: 1,
          content:
            'સજીવો દ્વારા ખોરાક ગ્રહણ કરવાની અને શરીરમાં તેનો ઉપયોગ કરવાની પ્રક્રિયાને પોષણ કહે છે. વનસ્પતિ પોતાના ખોરાકનું જાતે નિર્માણ કરતી હોવાથી તેને સ્વાવલંબી (Autotrophic) પોષણ કહેવાય છે. જ્યારે પ્રાણીઓ ખોરાક માટે વનસ્પતિ પર નિર્ભર હોવાથી તેમને પરાવલંબી (Heterotrophic) કહેવાય છે.'
        },
        {
          page: 3,
          content:
            'પ્રકાશસંશ્લેષણ (Photosynthesis): લીલી વનસ્પતિ સૂર્યપ્રકાશ, હરિતદ્રવ્ય (ક્લોરોફિલ), કાર્બન ડાયોક્સાઇડ અને પાણીની હાજરીમાં પોતાનો ખોરાક તૈયાર કરે છે, જેને પ્રકાશસંશ્લેષણ કહે છે. પર્ણો એ વનસ્પતિના ખોરાક બનાવવાના કારખાના છે. પર્ણની સપાટી પર આવેલા નાના છિદ્રોને પર્ણરંધ્ર (Stomata) કહેવાય છે જેના દ્વારા હવામાંથી કાર્બન ડાયોક્સાઇડ અંદર લેવાય છે.'
        },
        {
          page: 5,
          content:
            'પ્રકાશસંશ્લેષણનું સમીકરણ: કાર્બન ડાયોક્સાઇડ + પાણી ---> (સૂર્યપ્રકાશ અને હરિતદ્રવ્યની હાજરીમાં) કાર્બોદિત (ગ્લુકોઝ) + ઓક્સિજન. આ પ્રક્રિયા દરમિયાન મુક્ત થતો ઓક્સિજન પૃથ્વી પરના તમામ સજીવો માટે પ્રાણવાયુ તરીકે અત્યંત આવશ્યક છે. વનસ્પતિમાં વધારાનો કાર્બોદિત પદાર્થ સ્ટાર્ચ સ્વરૂપે સંગ્રહાય છે.'
        }
      ]
    }
  ];

  for (const book of initialBooks) {
    const doc = await prisma.textbookDocument.create({
      data: {
        title: book.title,
        titleGu: book.titleGu,
        board: book.board,
        standard: book.standard,
        subject: book.subject,
        medium: book.medium,
        academicYear: book.academicYear,
        chapterNumber: book.chapterNumber,
        chapterName: book.chapterName
      }
    });

    for (let idx = 0; idx < book.chunks.length; idx++) {
      const c = book.chunks[idx];
      const vector = generateSemanticVector(c.content);

      await prisma.textbookChunk.create({
        data: {
          documentId: doc.id,
          chunkIndex: idx + 1,
          content: c.content,
          pageNumber: c.page,
          chapterName: book.chapterName,
          vectorJson: JSON.stringify(vector),
          keywords: c.content
            .toLowerCase()
            .replace(/[^\w\s\u0A80-\u0AFF]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 3)
            .slice(0, 15)
            .join(' ')
        }
      });
    }
  }

  console.log(`✅ Successfully seeded ${initialBooks.length} textbooks with indexed semantic chunks.`);
}

/**
 * Main RAG retrieval and answer pipeline strictly grounded in textbooks
 */
export async function executeTextbookRAG(params: RAGQueryParams): Promise<RAGAnswerResult> {
  await ensureSeedTextbooksExist();

  const { question, board, standard, subject, medium, language = 'en' } = params;
  const isGu = language === 'gu' || /[\u0A80-\u0AFF]/.test(question);
  const isHi = language === 'hi';

  const queryVector = generateSemanticVector(question);

  // 1. Build document filter based on selected board, class, or subject
  const docWhere: any = {};
  if (board && board !== 'ALL') {
    docWhere.board = board;
  }
  if (standard && standard !== 'ALL') {
    docWhere.standard = standard;
  }
  if (subject && subject !== 'ALL' && subject !== 'All') {
    docWhere.subject = { contains: subject };
  }
  if (medium && medium !== 'ALL') {
    docWhere.medium = medium;
  }

  // 2. Fetch candidate chunks
  const chunks = await prisma.textbookChunk.findMany({
    where: Object.keys(docWhere).length > 0 ? { document: docWhere } : undefined,
    include: {
      document: true
    }
  });

  if (chunks.length === 0) {
    const refusalText = isGu
      ? 'આ માહિતી ઉપલબ્ધ NCERT/ગુજરાત બોર્ડના પાઠ્યપુસ્તકોમાં મળી શકી નથી.'
      : isHi
      ? 'यह जानकारी उपलब्ध एनसीईआरटी/गुजरात बोर्ड की पाठ्यपुस्तकों में नहीं मिली।'
      : 'This information could not be found in the available NCERT/Gujarat Board textbooks.';

    return {
      question,
      answer: refusalText,
      isGrounded: false,
      relevanceScore: 0,
      board: board || 'ALL',
      citations: [],
      groundingStatus: 'NOT_FOUND'
    };
  }

  // 3. Compute hybrid relevance scores (cosine semantic similarity + lexical keyword match)
  const scoredChunks: Array<{
    chunk: typeof chunks[0];
    score: number;
    cosineScore: number;
    keywordScore: number;
  }> = [];

  for (const c of chunks) {
    let vec: Record<string, number> = {};
    try {
      if (c.vectorJson) {
        vec = JSON.parse(c.vectorJson);
      } else {
        vec = generateSemanticVector(c.content);
      }
    } catch {
      vec = generateSemanticVector(c.content);
    }

    const cosineScore = calculateCosineSimilarity(queryVector, vec);
    const keywordScore = calculateKeywordOverlap(question, c.content);

    // Hybrid combination with heavy weight on keyword hit when specific terminology is matched
    const hybridScore = cosineScore * 0.65 + keywordScore * 0.35;

    scoredChunks.push({
      chunk: c,
      score: hybridScore,
      cosineScore,
      keywordScore
    });
  }

  // Rank descending
  scoredChunks.sort((a, b) => b.score - a.score);

  const topMatch = scoredChunks[0];
  const RELEVANCE_THRESHOLD = 0.20; // Minimum threshold required for factual grounding

  // Anti-hallucination refusal: If evidence is not in textbooks, do not present guesses.
  // Require substantive keyword match or strong semantic similarity.
  const isSufficientlyGrounded =
    topMatch &&
    topMatch.score >= RELEVANCE_THRESHOLD &&
    (topMatch.keywordScore >= 0.15 || topMatch.cosineScore >= 0.35);

  if (!isSufficientlyGrounded) {
    const refusalText = isGu
      ? 'આ માહિતી ઉપલબ્ધ NCERT/ગુજરાત બોર્ડના પાઠ્યપુસ્તકોમાં મળી શકી નથી.'
      : isHi
      ? 'यह जानकारी उपलब्ध एनसीईआरटी/गुजरात बोर्ड की पाठ्यपुस्तकों में नहीं मिली।'
      : 'This information could not be found in the available NCERT/Gujarat Board textbooks.';

    return {
      question,
      answer: refusalText,
      isGrounded: false,
      relevanceScore: Math.round((topMatch?.score || 0) * 100),
      board: board || 'ALL',
      citations: [],
      groundingStatus: 'NOT_FOUND'
    };
  }

  // 4. Extract top 3 supporting passages
  const topCitations: TextbookCitation[] = scoredChunks.slice(0, 3).map(sc => ({
    id: sc.chunk.id,
    documentId: sc.chunk.documentId,
    textbookTitle: sc.chunk.document.title,
    board: sc.chunk.document.board,
    standard: sc.chunk.document.standard,
    subject: sc.chunk.document.subject,
    medium: sc.chunk.document.medium,
    chapterName: sc.chunk.chapterName || sc.chunk.document.chapterName || 'Chapter Details',
    chapterNumber: sc.chunk.document.chapterNumber,
    pageNumber: sc.chunk.pageNumber,
    excerpt: sc.chunk.content,
    score: Math.round(sc.score * 100)
  }));

  // 5. Synthesize grounded answer strictly from citations
  const primaryChunk = topCitations[0];
  const primaryBoard = primaryChunk.board;
  const primaryStd = primaryChunk.standard;
  const primarySub = primaryChunk.subject;
  const primaryPage = primaryChunk.pageNumber;

  // Filter supplementary highlights strictly to the same textbook document / chapter
  const sameDocRelated = topCitations.filter(
    c => c.documentId === primaryChunk.documentId && c.id !== primaryChunk.id && c.score >= 25
  );

  // Synthesize clean student explanation formatted for Class 6-8
  let formattedAnswer = '';

  if (isGu) {
    formattedAnswer = `### 📖 પાઠ્યપુસ્તક આધારિત ઉત્તર (${primaryBoard} - ${primaryStd} ${primarySub})\n\n`;
    formattedAnswer += `${primaryChunk.excerpt}\n\n`;
    if (sameDocRelated.length > 0) {
      formattedAnswer += `**મુખ્ય મુદ્દાઓ / વિગતો:**\n`;
      for (const rel of sameDocRelated.slice(0, 2)) {
        formattedAnswer += `- ${rel.excerpt.split('.')[0]}.\n`;
      }
    }
    formattedAnswer += `\n📌 **સંદર્ભ:** ${primaryChunk.textbookTitle}, પાનું નં. ${primaryPage}.`;
  } else if (isHi) {
    formattedAnswer = `### 📖 पाठ्यपुस्तक आधारित उत्तर (${primaryBoard} - ${primaryStd} ${primarySub})\n\n`;
    formattedAnswer += `${primaryChunk.excerpt}\n\n`;
    if (sameDocRelated.length > 0) {
      formattedAnswer += `**मुख्य बिंदु:**\n`;
      for (const rel of sameDocRelated.slice(0, 2)) {
        formattedAnswer += `- ${rel.excerpt.split('.')[0]}.\n`;
      }
    }
    formattedAnswer += `\n📌 **संदर्भ:** ${primaryChunk.textbookTitle}, पृष्ठ संख्या ${primaryPage}.`;
  } else {
    formattedAnswer = `### 📖 Textbook Grounded Answer (${primaryBoard} - ${primaryStd} ${primarySub})\n\n`;
    formattedAnswer += `${primaryChunk.excerpt}\n\n`;
    if (sameDocRelated.length > 0) {
      formattedAnswer += `**Key Concept Highlights:**\n`;
      for (const rel of sameDocRelated.slice(0, 2)) {
        formattedAnswer += `- ${rel.excerpt.split('.')[0]}.\n`;
      }
    }
    formattedAnswer += `\n📌 **Source:** ${primaryChunk.textbookTitle}, Page ${primaryPage}.`;
  }

  return {
    question,
    answer: formattedAnswer,
    isGrounded: true,
    relevanceScore: primaryChunk.score,
    board: primaryBoard,
    citations: topCitations,
    groundingStatus: 'VERIFIED'
  };
}
