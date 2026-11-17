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
  topicName?: string | null;
  sectionName?: string | null;
  pageNumber: number;
  excerpt: string;
  score: number;
}

export interface StepItem {
  stepNumber: number;
  title: string;
  description: string;
  ncertConceptLink?: string;
}

export interface RAGAnswerResult {
  question: string;
  answer: string;
  isGrounded: boolean;
  relevanceScore: number;
  board?: string;
  citations: TextbookCitation[];
  groundingStatus: 'VERIFIED' | 'NOT_FOUND' | 'INSUFFICIENT_EVIDENCE';
  sourceVerification: string;
  stepByStepSolution?: StepItem[];
  sourceChunkIds?: string[];
  auditId?: string;
}

export interface RAGQueryParams {
  question: string;
  board?: string; // 'NCERT' | 'GSEB' | 'ALL'
  standard?: string; // 'Class 10', 'Class 9', 'Standard 8', 'Standard 7', 'Standard 6', 'ALL'
  subject?: string;
  chapter?: string;
  topic?: string;
  section?: string;
  medium?: string;
  language?: string; // 'en' | 'gu' | 'hi'
  ncertMode?: boolean;
  userId?: string;
}

// Common Stop Words (English, Gujarati, Hindi)
const STOP_WORDS = new Set([
  // English Stopwords
  'the', 'is', 'are', 'was', 'were', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'with',
  'a', 'an', 'of', 'by', 'from', 'about', 'into', 'over', 'after', 'beneath', 'under',
  'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how', 'all', 'any',
  'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should',
  'now', 'give', 'gives', 'tell', 'me', 'please', 'explain', 'describe', 'definition', 'define',
  'their', 'they', 'them', 'these', 'those', 'this', 'that', 'there', 'here', 'its',
  // Gujarati Stopwords
  'અને', 'કે', 'છે', 'હતો', 'હતી', 'હતા', 'હશે', 'માટે', 'પર', 'થી', 'દ્વારા', 'માં',
  'આ', 'તે', 'એ', 'જે', 'તેમ', 'નથી', 'હોય', 'કરવું', 'કરે', 'કરી', 'શકે', 'આપો', 'શું',
  'કઈ', 'કયો', 'કયા', 'કેટલા', 'કેવી', 'રીતે', 'જણાવો', 'સમજાવો', 'લખો', 'એટલે', 'વ્યાખ્યા', 'વિશે',
  // Hindi Stopwords
  'और', 'के', 'है', 'था', 'थी', 'थे', 'होगा', 'लिए', 'पर', 'से', 'द्वारा', 'में',
  'यह', 'वह', 'जो', 'नहीं', 'होता', 'करना', 'करते', 'सकते', 'क्या', 'कैसे', 'किस', 'बताइए', 'समझाइए'
]);

/**
 * Generates a normalized semantic vector (term frequencies + sublinear scaling + n-grams)
 */
export function generateSemanticVector(text: string): Record<string, number> {
  const normalized = text.toLowerCase().replace(/[^\w\s\u0A80-\u0AFF\u0900-\u097F]/g, ' ');
  const words = normalized.split(/\s+/).filter(w => w.length > 1);

  const freqMap: Record<string, number> = {};

  for (const word of words) {
    if (STOP_WORDS.has(word)) continue;
    freqMap[word] = (freqMap[word] || 0) + 1;

    // Sub-word character 3-grams for morphological variation
    if (word.length >= 4) {
      for (let i = 0; i <= word.length - 3; i++) {
        const trigram = `_3_${word.substring(i, i + 3)}`;
        freqMap[trigram] = (freqMap[trigram] || 0) + 0.35;
      }
    }
  }

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
 * Calculates cosine similarity between vectors
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
 * Calculates keyword overlap with Indic stemming
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
 * Chunks large text into overlapping segments
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
 * Ensures authorized NCERT & State curriculum books are indexed with full metadata
 */
export async function ensureSeedTextbooksExist(forceRefresh: boolean = false): Promise<void> {
  const ncertBooksCount = await prisma.textbookDocument.count({
    where: { board: 'NCERT' }
  });

  // If already seeded with 6+ NCERT books, skip unless forced
  if (ncertBooksCount >= 7 && !forceRefresh) return;

  console.log('📚 Syncing comprehensive NCERT-verified Knowledge Database...');

  const booksToSeed = [
    // 1. NCERT Class 10 Mathematics - Linear Equations (Exercise 3.2, Page 58)
    {
      title: 'NCERT Class 10 Mathematics - Chapter 3: Pair of Linear Equations in Two Variables',
      titleGu: 'NCERT ધોરણ ૧૦ ગણિત - પ્રકરણ ૩: દ્વિચલ સુરેખ સમીકરણ યુગ્મ',
      board: 'NCERT',
      standard: 'Class 10',
      subject: 'Mathematics',
      medium: 'English',
      academicYear: '2025-2026',
      version: '1.0',
      chapterNumber: 3,
      chapterName: 'Pair of Linear Equations in Two Variables',
      topic: 'Algebraic Methods: Substitution & Elimination Methods',
      chunks: [
        {
          page: 58,
          sectionName: 'Exercise 3.2',
          topicName: 'Substitution Method',
          content:
            'NCERT Class 10 Mathematics Chapter 3: Pair of Linear Equations in Two Variables. Section: Exercise 3.2 on Page 58. The Substitution Method solves a pair of linear equations by expressing one variable in terms of the other from one equation, and then substituting this value into the other equation. Step 1: Find the value of one variable (say y) in terms of the other variable (x) from either equation. Step 2: Substitute this value of y in the other equation to get an equation in only x. Step 3: Solve this single-variable linear equation for x. Step 4: Substitute the obtained value of x into the step 1 relation to determine y. Example: Solve x + y = 14 and x - y = 4. From equation 2, x = 4 + y. Substitute into equation 1: (4 + y) + y = 14 => 2y = 10 => y = 5, hence x = 9.',
          q: 'How to solve a pair of linear equations by substitution method?',
          a: 'Step 1: Express one variable in terms of the other from one equation. Step 2: Substitute this into the second equation to get a single-variable equation. Step 3: Solve for the first variable. Step 4: Back-substitute into the express equation to find the second variable.'
        },
        {
          page: 60,
          sectionName: 'Section 3.3',
          topicName: 'Elimination Method',
          content:
            'NCERT Class 10 Mathematics Chapter 3 Page 60. Elimination Method: To eliminate one variable, first multiply one or both equations by suitable non-zero constants to make the coefficients of one variable numerically equal. Then add or subtract the two equations to eliminate that variable. Solve the resulting equation in one variable and substitute the result back into any original equation to obtain the value of the other variable.',
          q: 'Explain the Elimination Method for solving linear equations.',
          a: 'Multiply equations by constants so coefficients of one variable match, add or subtract equations to eliminate that variable, solve for remaining variable, and substitute back.'
        },
        {
          page: 46,
          sectionName: 'Section 3.2',
          topicName: 'Consistency and Graphical Nature',
          content:
            'NCERT Class 10 Mathematics Chapter 3 Page 46. For a pair of linear equations a1*x + b1*y + c1 = 0 and a2*x + b2*y + c2 = 0: (1) If a1/a2 != b1/b2, the lines intersect at a unique point, and the system is Consistent with exactly ONE solution. (2) If a1/a2 = b1/b2 = c1/c2, the lines are coincident, and the system is Consistent with INFINITELY MANY solutions. (3) If a1/a2 = b1/b2 != c1/c2, the lines are parallel, and the system is Inconsistent with NO solution.',
          q: 'What are the conditions for consistency of two linear equations?',
          a: 'Unique solution: a1/a2 != b1/b2. Infinitely many solutions: a1/a2 = b1/b2 = c1/c2. No solution (inconsistent): a1/a2 = b1/b2 != c1/c2.'
        }
      ]
    },

    // 2. NCERT Class 10 Science - Chemical Reactions & Equations
    {
      title: 'NCERT Class 10 Science - Chapter 1: Chemical Reactions and Equations',
      titleGu: 'NCERT ધોરણ ૧૦ વિજ્ઞાન - પ્રકરણ ૧: રાસાયણિક પ્રક્રિયાઓ અને સમીકરણો',
      board: 'NCERT',
      standard: 'Class 10',
      subject: 'Science',
      medium: 'English',
      academicYear: '2025-2026',
      version: '1.0',
      chapterNumber: 1,
      chapterName: 'Chemical Reactions and Equations',
      topic: 'Balancing Chemical Equations & Types of Reactions',
      chunks: [
        {
          page: 8,
          sectionName: 'Section 1.1',
          topicName: 'Balancing Chemical Equations',
          content:
            'NCERT Class 10 Science Chapter 1 Page 8. Step-by-Step Balancing of Chemical Equations: A balanced chemical equation has an equal number of atoms of each element on both sides of the arrow, obeying the Law of Conservation of Mass (mass can neither be created nor destroyed in a chemical reaction). Step 1: Write the skeletal equation and draw boxes around formulas (never alter formulas inside boxes). Step 2: List the number of atoms of different elements present in the unbalanced equation on LHS and RHS. Step 3: Start balancing with the compound having the maximum number of atoms. Step 4: Balance hydrogen and oxygen atoms next. Step 5: Check correctness by counting atoms of each element on both sides. Example: Fe + H2O -> Fe3O4 + H2 balances to 3Fe + 4H2O -> Fe3O4 + 4H2.',
          q: 'What are the steps to balance a chemical equation according to NCERT?',
          a: 'Step 1: Write skeletal equation with formulas in boxes. Step 2: Tabulate atom counts on LHS and RHS. Step 3: Balance element with max atoms first by adjusting coefficients. Step 4: Balance H and O atoms. Step 5: Verify all atom counts are equal.'
        },
        {
          page: 12,
          sectionName: 'Section 1.2',
          topicName: 'Types of Chemical Reactions',
          content:
            'NCERT Class 10 Science Chapter 1 Section 1.2 Page 12. Types of Chemical Reactions: (1) Combination Reaction: Two or more substances combine to form a single product. Example: Calcium oxide (quicklime, CaO) reacts vigorously with water to form calcium hydroxide (slaked lime, Ca(OH)2), releasing heat. (2) Decomposition Reaction: A single reactant breaks down into two or more simpler products on heating (thermal), light (photolytic), or electricity (electrolytic). Example: 2FeSO4 (green) on heating decomposes into Fe2O3 (brown) + SO2 + SO3. (3) Displacement Reaction: A more reactive element displaces a less reactive element from its salt solution (Fe + CuSO4 -> FeSO4 + Cu). (4) Double Displacement Reaction: Ions are exchanged between reactants (Na2SO4 + BaCl2 -> BaSO4 precipitate + 2NaCl). (5) Redox Reaction: One reactant gets oxidized (gains oxygen/loses hydrogen) while the other gets reduced (loses oxygen/gains hydrogen).',
          q: 'Explain types of chemical reactions with NCERT examples.',
          a: '1. Combination (CaO + H2O -> Ca(OH)2), 2. Decomposition (2FeSO4 -> Fe2O3 + SO2 + SO3), 3. Displacement (Fe + CuSO4 -> FeSO4 + Cu), 4. Double Displacement (Na2SO4 + BaCl2 -> BaSO4 + 2NaCl), 5. Redox (CuO + H2 -> Cu + H2O).'
        }
      ]
    },

    // 3. NCERT Class 9 Science - Force and Laws of Motion (Newton's Laws)
    {
      title: 'NCERT Class 9 Science - Chapter 9: Force and Laws of Motion',
      titleGu: 'NCERT ધોરણ ૯ વિજ્ઞાન - પ્રકરણ ૯: બળ તથા ગતિના નિયમો',
      board: 'NCERT',
      standard: 'Class 9',
      subject: 'Science',
      medium: 'English',
      academicYear: '2025-2026',
      version: '1.0',
      chapterNumber: 9,
      chapterName: 'Force and Laws of Motion',
      topic: "Newton's Three Laws of Motion & F=ma Derivation",
      chunks: [
        {
          page: 118,
          sectionName: 'Section 9.3',
          topicName: "Newton's Second Law of Motion",
          content:
            "NCERT Class 9 Science Chapter 9 Section 9.3 Page 118. Newton's Second Law of Motion: The rate of change of momentum of an object is directly proportional to the applied unbalanced force in the direction of force. Mathematical Derivation Step-by-Step: Consider an object of mass m moving with initial velocity u. Let an unbalanced force F act on it for time t, changing velocity to v. Initial momentum p1 = m*u. Final momentum p2 = m*v. Change in momentum = p2 - p1 = m*(v - u). Rate of change of momentum = m*(v - u) / t. Since acceleration a = (v - u)/t, Force F is proportional to m*a. Therefore, F = k*m*a. In SI units, the constant of proportionality k is chosen as 1, yielding F = m*a. Unit of Force is Newton (N), where 1 N = 1 kg·m/s².",
          q: "Derive F = ma from Newton's Second Law of Motion.",
          a: 'Rate of change of momentum = m(v - u)/t = ma. Force F ∝ ma, hence F = k·m·a. With k=1 in SI units, F = ma (Newton).'
        },
        {
          page: 122,
          sectionName: 'Section 9.4',
          topicName: "Newton's Third Law and Conservation of Momentum",
          content:
            "NCERT Class 9 Science Chapter 9 Section 9.4 Page 122. Newton's Third Law of Motion states that to every action, there is always an equal and opposite reaction; they act on two different objects simultaneously. Law of Conservation of Momentum: When two or more bodies interact, the total momentum of an isolated system remains conserved provided no external unbalanced force acts on it: m1*u1 + m2*u2 = m1*v1 + m2*v2.",
          q: "State Newton's Third Law and Law of Conservation of Momentum.",
          a: "Action and reaction are equal and opposite, acting on different bodies. Total momentum before collision equals total momentum after collision: m1u1 + m2u2 = m1v1 + m2v2."
        }
      ]
    },

    // 4. NCERT Class 8 Science - Force and Pressure
    {
      title: 'NCERT Class 8 Science - Chapter 11: Force and Pressure',
      titleGu: 'NCERT ધોરણ ૮ વિજ્ઞાન - પ્રકરણ ૧૧: બળ અને દબાણ',
      board: 'NCERT',
      standard: 'Standard 8',
      subject: 'Science',
      medium: 'English',
      academicYear: '2025-2026',
      version: '1.0',
      chapterNumber: 11,
      chapterName: 'Force and Pressure',
      topic: 'Force, Contact/Non-contact Forces, and Pressure Formula',
      chunks: [
        {
          page: 128,
          sectionName: 'Section 11.1',
          topicName: 'Definition of Force',
          content:
            'NCERT Class 8 Science Chapter 11 Section 11.1 Page 128. A force is an interaction between objects resulting in a push or a pull. Actions like opening a door, hitting a ball, lifting a bag, or pressing a sponge involve applying force. A force can change the state of motion of an object from rest to moving, or alter its speed and direction of travel. Forces have both magnitude and direction.',
          q: 'What is force according to NCERT Class 8 Science?',
          a: 'A force is a push or pull on an object resulting from its interaction with another object. It has magnitude and direction.'
        },
        {
          page: 130,
          sectionName: 'Section 11.2',
          topicName: 'Contact and Non-contact Forces',
          content:
            'NCERT Class 8 Science Chapter 11 Section 11.2 Page 130. Contact forces require physical touch between objects: Muscular Force (produced by muscles) and Friction (force opposing relative motion between surfaces). Non-contact forces act from a distance: Magnetic Force, Electrostatic Force (force exerted by a charged body on another), and Gravitational Force (attraction exerted by Earth on all objects).',
          q: 'Differentiate between contact and non-contact forces with NCERT examples.',
          a: 'Contact forces require physical contact (muscular force, friction). Non-contact forces act across a distance (gravity, magnetism, electrostatic force).'
        },
        {
          page: 134,
          sectionName: 'Section 11.8',
          topicName: 'Pressure Formula and Applications',
          content:
            'NCERT Class 8 Science Chapter 11 Section 11.8 Page 134. Pressure is defined as the force acting per unit area of a surface: Pressure = Force / Area (P = F / A). For a given force, a smaller area yields greater pressure. This is why nails have sharp pointed tips to penetrate wood easily, and school bags have broad shoulder straps to distribute weight over a larger area and reduce pressure on the shoulders. The SI unit of pressure is Pascal (Pa) or N/m².',
          q: 'What is the formula of pressure and why do school bags have wide straps?',
          a: 'Pressure = Force / Area. Wide straps increase contact area, thereby reducing the pressure exerted on the student shoulders.'
        }
      ]
    },

    // 5. NCERT Class 8 Mathematics - Linear Equations in One Variable
    {
      title: 'NCERT Class 8 Mathematics - Chapter 2: Linear Equations in One Variable',
      titleGu: 'NCERT ધોરણ ૮ ગણિત - પ્રકરણ ૨: એકચલ સુરેખ સમીકરણ',
      board: 'NCERT',
      standard: 'Standard 8',
      subject: 'Mathematics',
      medium: 'English',
      academicYear: '2025-2026',
      version: '1.0',
      chapterNumber: 2,
      chapterName: 'Linear Equations in One Variable',
      topic: 'Solving Linear Equations by Transposition',
      chunks: [
        {
          page: 21,
          sectionName: 'Section 2.1',
          topicName: 'Definition of Linear Equation',
          content:
            'NCERT Class 8 Mathematics Chapter 2 Section 2.1 Page 21. An algebraic equation is an equality involving variables and constants. A linear equation in one variable is an equation where the highest exponent of the single variable is 1. The standard form is ax + b = c (where a != 0). The expression to the left of the equal sign is LHS and to the right is RHS.',
          q: 'What is a linear equation in one variable?',
          a: 'An algebraic equality containing a single variable whose highest power/exponent is 1.'
        },
        {
          page: 24,
          sectionName: 'Exercise 2.2',
          topicName: 'Transposition Method Step-by-Step',
          content:
            'NCERT Class 8 Mathematics Chapter 2 Exercise 2.2 Page 24. Step-by-step Transposition Method: (1) Simplify both sides by opening brackets and collecting like terms. (2) Transpose all variable terms to LHS and constant terms to RHS by reversing their operation (+ becomes -, - becomes +, * becomes /, / becomes *). (3) Combine like terms on both sides. (4) Divide both sides by the variable coefficient to isolate the variable. Example: Solve 5x + 9 = 5 + 3x. Step 1: Transpose 3x to LHS: 5x - 3x + 9 = 5 => 2x + 9 = 5. Step 2: Transpose 9 to RHS: 2x = 5 - 9 => 2x = -4. Step 3: Divide by 2: x = -4 / 2 = -2.',
          q: 'How do you solve linear equations with variables on both sides?',
          a: 'Transpose variable terms to LHS and constants to RHS, reversing their signs. Simplify like terms and divide by the coefficient.'
        }
      ]
    },

    // 6. NCERT Class 8 Social Science - History Chapter 2: From Trade to Territory
    {
      title: 'NCERT Class 8 Social Science (Our Pasts - III) - Chapter 2: From Trade to Territory',
      titleGu: 'NCERT ધોરણ ૮ સામાજિક વિજ્ઞાન - પ્રકરણ ૨: વેપારથી સામ્રાજ્ય સુધી',
      board: 'NCERT',
      standard: 'Standard 8',
      subject: 'Social Science',
      medium: 'English',
      academicYear: '2025-2026',
      version: '1.0',
      chapterNumber: 2,
      chapterName: 'From Trade to Territory',
      topic: 'The East India Company and Battle of Plassey',
      chunks: [
        {
          page: 10,
          sectionName: 'Section 2.1',
          topicName: 'East India Company Charter',
          content:
            'NCERT Class 8 Social Science Chapter 2 Page 10. In 1600, the East India Company acquired a royal charter from the ruler of England, Queen Elizabeth I, granting it the sole right to trade with the East. This meant that no other English trading group could compete with the East India Company. With this charter the Company could venture across the oceans, looking for new lands from which it could buy goods at a cheap price and carry them back to Europe to sell at higher prices.',
          q: 'What charter did the East India Company acquire in 1600?',
          a: 'A royal charter from Queen Elizabeth I granting exclusive monopoly rights to trade with the East without competition from other English merchants.'
        },
        {
          page: 12,
          sectionName: 'Section 2.2',
          topicName: 'Battle of Plassey (1757)',
          content:
            'NCERT Class 8 Social Science Chapter 2 Section 2.2 Page 12. The Battle of Plassey (1757) became famous because it was the first major victory the East India Company won in India. When Alivardi Khan died in 1756, Sirajuddaulah became the Nawab of Bengal. Robert Clive led the Company army against Sirajuddaulah at Plassey. One of the main reasons for the defeat of the Nawab was that the forces led by Mir Jafar, one of Sirajuddaulah commanders, never fought the battle. Clive had managed to secure his support by promising to make him nawab after crushing Sirajuddaulah.',
          q: 'Why was the Battle of Plassey a turning point in Indian history according to NCERT?',
          a: 'It was the Company first major military victory in India, allowing it to transition from a trading company into a territorial colonial power.'
        }
      ]
    },

    // 7. NCERT Class 8 English (Honeydew) - Chapter 1: The Best Christmas Present in the World
    {
      title: 'NCERT Class 8 English (Honeydew) - Chapter 1: The Best Christmas Present in the World',
      titleGu: 'NCERT ધોરણ ૮ અંગ્રેજી (Honeydew) - પ્રકરણ ૧: ધ બેસ્ટ ક્રિસમસ પ્રેઝન્ટ ઇન ધ વર્લ્ડ',
      board: 'NCERT',
      standard: 'Standard 8',
      subject: 'English',
      medium: 'English',
      academicYear: '2025-2026',
      version: '1.0',
      chapterNumber: 1,
      chapterName: 'The Best Christmas Present in the World',
      topic: 'Christmas Truce in the WWI Trenches',
      chunks: [
        {
          page: 9,
          sectionName: 'Comprehension Check',
          topicName: 'Discovery of the Letter',
          content:
            'NCERT Class 8 English Honeydew Chapter 1 Page 9. The author finds a 19th-century roll-top desk in a junk shop in Bridport. While restoring it on Christmas Eve, in a secret drawer beneath the roll-top, he discovers a small black tin box with a piece of lined notepaper sellotaped to its top: "Jim letter, received January 25, 1915. To be buried with me when the time comes." Inside was a letter written by Captain Jim Macpherson of the British army to his wife Connie describing the 1914 Christmas truce in No Man Land.',
          q: 'What did the author find in a secret drawer in NCERT Honeydew Chapter 1?',
          a: 'A small black tin box containing a letter from British Captain Jim Macpherson to his wife Connie about the WWI Christmas truce.'
        }
      ]
    },

    // 8. NCERT Class 8 Hindi (Vasant) - Chapter 1: ध्वनि (Dhvani)
    {
      title: 'NCERT Class 8 Hindi (Vasant - III) - Chapter 1: ध्वनि',
      titleGu: 'NCERT ધોરણ ૮ હિન્દી (Vasant) - પ્રકરણ ૧: ધ્વનિ',
      board: 'NCERT',
      standard: 'Standard 8',
      subject: 'Hindi',
      medium: 'Hindi',
      academicYear: '2025-2026',
      version: '1.0',
      chapterNumber: 1,
      chapterName: 'ध्वनि',
      topic: 'सूर्यकांत त्रिपाठी निराला की कविता और भावार्थ',
      chunks: [
        {
          page: 2,
          sectionName: 'कविता एवं प्रश्न-अभ्यास',
          topicName: 'कविता का केंद्रीय भाव',
          content:
            'NCERT Class 8 Hindi Vasant Chapter 1 Page 2. "अभी न होगा मेरा अंत / अभी-अभी ही तो आया है / मेरे वन में मृदुल वसंत / अभी न होगा मेरा अंत।" कवि सूर्यकांत त्रिपाठी "निराला" के अनुसार उनका अंत अभी नहीं हो सकता क्योंकि उनके जीवन रूपी वन में वसंत का आगमन अभी ही हुआ है। वे प्रकृति के माध्यम से निराश और आलसी युवाओं में नया उत्साह और चेतना भरना चाहते हैं। वे निद्रित कलियों पर अपने कोमल हाथ फेरकर उन्हें प्रभात का संदेश देना चाहते हैं।',
          q: 'कवि को ऐसा विश्वास क्यों है कि उसका अंत अभी नहीं होगा?',
          a: 'क्योंकि कवि के जीवन रूपी उपवन में अभी-अभी मधुर वसंत का आगमन हुआ है और उन्हें युवाओं में नई चेतना और उत्साह जगाना है।'
        }
      ]
    },

    // 9. NCERT Class 7 Science - Nutrition in Plants
    {
      title: 'NCERT Class 7 Science - Chapter 1: Nutrition in Plants',
      titleGu: 'NCERT ધોરણ ૭ વિજ્ઞાન - પ્રકરણ ૧: વનસ્પતિમાં પોષણ',
      board: 'NCERT',
      standard: 'Standard 7',
      subject: 'Science',
      medium: 'English',
      academicYear: '2025-2026',
      version: '1.0',
      chapterNumber: 1,
      chapterName: 'Nutrition in Plants',
      topic: 'Photosynthesis Process and Chemical Equation',
      chunks: [
        {
          page: 3,
          sectionName: 'Section 1.2',
          topicName: 'Photosynthesis Chemical Process',
          content:
            'NCERT Class 7 Science Chapter 1 Section 1.2 Page 3. Photosynthesis: Green plants prepare food in the presence of sunlight, chlorophyll, water, and carbon dioxide. Leaves are the food factories of plants. Carbon dioxide is absorbed through tiny pores called Stomata, surrounded by guard cells. Chlorophyll in leaves traps solar energy. Equation: Carbon dioxide + Water (with Sunlight and Chlorophyll) -> Carbohydrate (Glucose) + Oxygen. Oxygen released into the air is vital for all aerobic life. Excess glucose is converted to starch.',
          q: 'Explain photosynthesis with its equation from NCERT Class 7 Science.',
          a: 'Process where green plants synthesize glucose and oxygen from carbon dioxide and water using solar energy trapped by chlorophyll: 6CO2 + 6H2O -> C6H12O6 + 6O2.'
        }
      ]
    }
  ];

  for (const book of booksToSeed) {
    const existing = await prisma.textbookDocument.findFirst({
      where: {
        board: book.board,
        standard: book.standard,
        subject: book.subject,
        chapterNumber: book.chapterNumber
      }
    });

    if (existing) {
      // Update metadata and version if needed
      await prisma.textbookDocument.update({
        where: { id: existing.id },
        data: {
          version: book.version,
          topic: book.topic,
          title: book.title
        }
      });
      continue;
    }

    const doc = await prisma.textbookDocument.create({
      data: {
        title: book.title,
        titleGu: book.titleGu,
        board: book.board,
        standard: book.standard,
        subject: book.subject,
        medium: book.medium,
        academicYear: book.academicYear,
        version: book.version,
        chapterNumber: book.chapterNumber,
        chapterName: book.chapterName,
        topic: book.topic
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
          topicName: c.topicName,
          sectionName: c.sectionName,
          questionText: c.q || null,
          answerText: c.a || null,
          vectorJson: JSON.stringify(vector),
          keywords: `${book.board} ${book.standard} ${book.subject} ${book.chapterName} ${c.topicName} ${c.sectionName}`.toLowerCase()
        }
      });
    }
  }

  console.log('✅ NCERT-verified Knowledge Database synchronized successfully.');
}

/**
 * Calls Gemini with strict grounding instructions when API key is available
 */
async function generateGroundedAnswerWithGemini(
  question: string,
  citations: TextbookCitation[],
  language: string,
  isMathOrScience: boolean
): Promise<{ answer: string; stepByStep?: StepItem[] } | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;

  try {
    const contextText = citations
      .map(
        (c, idx) =>
          `[Source ${idx + 1}] Textbook: ${c.textbookTitle} | Standard: ${c.standard} | Subject: ${c.subject} | Chapter ${c.chapterNumber || ''}: ${c.chapterName} | Section: ${c.sectionName || ''} | Page: ${c.pageNumber}\nContent: ${c.excerpt}`
      )
      .join('\n\n');

    const prompt = `You are an NCERT-grounded academic assistant.
STRICT RULES:
1. You must ONLY answer using the provided textbook excerpts.
2. If the user's question cannot be verified from the provided excerpts, return EXACTLY:
   "This information could not be verified from the available NCERT sources."
3. Do NOT assume, fabricate, or add outside facts.
4. For Mathematics or Science problems, provide a structured step-by-step solution connecting each step to the relevant NCERT concept, formula, or example.
5. Language: Answer in ${language === 'gu' ? 'Gujarati' : language === 'hi' ? 'Hindi' : 'English'}.

USER QUESTION: "${question}"

AUTHORIZED TEXTBOOK PASSAGES:
${contextText}

Format your response as a valid JSON object matching this schema:
{
  "isGrounded": true,
  "answer": "Clear, direct, factual answer based strictly on the excerpts",
  "stepByStep": [
    {
      "stepNumber": 1,
      "title": "Step title",
      "description": "Explanation of mathematical or scientific calculation",
      "ncertConceptLink": "NCERT concept / formula reference"
    }
  ]
}
If the information is missing from the excerpts, set "isGrounded": false, "answer": "This information could not be verified from the available NCERT sources.", and "stepByStep": []`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1, // Near zero to prevent hallucinations
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) return null;

    const data: any = await response.json();
    const rawOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawOutput) return null;

    const parsed = JSON.parse(rawOutput);
    if (!parsed.isGrounded) return null;

    return {
      answer: parsed.answer,
      stepByStep: Array.isArray(parsed.stepByStep) && parsed.stepByStep.length > 0 ? parsed.stepByStep : undefined
    };
  } catch (err) {
    console.warn('[RAGEngine] Gemini synthesis error, falling back to local grounded synthesis:', err);
    return null;
  }
}

/**
 * Builds the strict, standardized Proof / Source Verification text
 * Example: Source: NCERT Class 10 Mathematics → Chapter 3: Pair of Linear Equations in Two Variables → Exercise 3.2 → Page 58.
 */
export function buildSourceVerificationText(primary: TextbookCitation): string {
  const parts: string[] = [
    `Source: ${primary.board || 'NCERT'} ${primary.standard} ${primary.subject}`
  ];

  if (primary.chapterNumber || primary.chapterName) {
    const chStr = primary.chapterNumber
      ? `Chapter ${primary.chapterNumber}: ${primary.chapterName}`
      : primary.chapterName;
    parts.push(chStr);
  }

  if (primary.sectionName) {
    parts.push(primary.sectionName);
  } else if (primary.topicName) {
    parts.push(primary.topicName);
  }

  if (primary.pageNumber) {
    parts.push(`Page ${primary.pageNumber}`);
  }

  return parts.join(' → ');
}

/**
 * Main RAG retrieval and answer pipeline strictly grounded in NCERT knowledge base
 */
export async function executeTextbookRAG(params: RAGQueryParams): Promise<RAGAnswerResult> {
  await ensureSeedTextbooksExist();

  const {
    question,
    board = 'NCERT',
    standard,
    subject,
    chapter,
    topic,
    language = 'en',
    ncertMode = true,
    userId
  } = params;

  const isGu = language === 'gu' || /[\u0A80-\u0AFF]/.test(question);
  const isHi = language === 'hi';

  const queryVector = generateSemanticVector(question);

  // 1. Build document filters
  const docWhere: any = {};
  if (ncertMode || board === 'NCERT') {
    docWhere.board = 'NCERT';
  } else if (board && board !== 'ALL') {
    docWhere.board = board;
  }

  if (standard && standard !== 'ALL') {
    docWhere.standard = standard;
  }

  if (subject && subject !== 'ALL' && subject !== 'All') {
    docWhere.subject = { contains: subject };
  }

  if (chapter && chapter !== 'ALL') {
    docWhere.chapterName = { contains: chapter };
  }

  // 2. Fetch candidate chunks
  const chunks = await prisma.textbookChunk.findMany({
    where: Object.keys(docWhere).length > 0 ? { document: docWhere } : undefined,
    include: {
      document: true
    }
  });

  const refusalEnglish = 'This information could not be verified from the available NCERT sources.';
  const refusalText = isGu
    ? 'આ માહિતી ઉપલબ્ધ NCERT પાઠ્યપુસ્તકોમાંથી ચકાસી શકાઈ નથી.'
    : isHi
    ? 'यह जानकारी उपलब्ध एनसीईआरटी स्रोतों से सत्यापित नहीं की जा सकी।'
    : refusalEnglish;

  if (chunks.length === 0) {
    // Log audit
    const audit = await prisma.ncertQueryAudit.create({
      data: {
        userId: userId || null,
        question,
        answer: refusalText,
        isGrounded: false,
        groundingStatus: 'NOT_FOUND',
        relevanceScore: 0,
        board: board || 'NCERT',
        standard: standard || null,
        subject: subject || null,
        citationsJson: '[]',
        sourceChunkIds: ''
      }
    });

    return {
      question,
      answer: refusalText,
      isGrounded: false,
      relevanceScore: 0,
      board: board || 'NCERT',
      citations: [],
      groundingStatus: 'NOT_FOUND',
      sourceVerification: '',
      auditId: audit.id
    };
  }

  // 3. Compute hybrid relevance scores
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

    // Contextual boost if question specifically mentions chapter or topic
    let metadataBoost = 0;
    const qLower = question.toLowerCase();
    if (c.topicName && qLower.includes(c.topicName.toLowerCase())) metadataBoost += 0.15;
    if (c.sectionName && qLower.includes(c.sectionName.toLowerCase())) metadataBoost += 0.20;
    if (c.chapterName && qLower.includes(c.chapterName.toLowerCase())) metadataBoost += 0.10;

    const hybridScore = Math.min(1.0, cosineScore * 0.60 + keywordScore * 0.40 + metadataBoost);

    scoredChunks.push({
      chunk: c,
      score: hybridScore,
      cosineScore,
      keywordScore
    });
  }

  scoredChunks.sort((a, b) => b.score - a.score);

  const topMatch = scoredChunks[0];
  const RELEVANCE_THRESHOLD = 0.24;

  // Strict anti-hallucination test: require substantive domain keyword match and semantic correlation
  const isSufficientlyGrounded =
    topMatch &&
    topMatch.score >= RELEVANCE_THRESHOLD &&
    topMatch.keywordScore >= 0.22 &&
    (topMatch.cosineScore >= 0.12 || topMatch.keywordScore >= 0.35);

  if (!isSufficientlyGrounded) {
    const audit = await prisma.ncertQueryAudit.create({
      data: {
        userId: userId || null,
        question,
        answer: refusalText,
        isGrounded: false,
        groundingStatus: 'NOT_FOUND',
        relevanceScore: Math.round((topMatch?.score || 0) * 100),
        board: board || 'NCERT',
        standard: standard || null,
        subject: subject || null,
        citationsJson: '[]',
        sourceChunkIds: ''
      }
    });

    return {
      question,
      answer: refusalText,
      isGrounded: false,
      relevanceScore: Math.round((topMatch?.score || 0) * 100),
      board: board || 'NCERT',
      citations: [],
      groundingStatus: 'NOT_FOUND',
      sourceVerification: '',
      auditId: audit.id
    };
  }

  // 4. Extract top supporting citations
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
    topicName: sc.chunk.topicName,
    sectionName: sc.chunk.sectionName,
    pageNumber: sc.chunk.pageNumber,
    excerpt: sc.chunk.content,
    score: Math.round(sc.score * 100)
  }));

  const primaryChunk = topCitations[0];
  const sourceVerificationStr = buildSourceVerificationText(primaryChunk);

  // Check if query is Math or Science problem
  const isMathOrScience =
    primaryChunk.subject.toLowerCase().includes('math') ||
    primaryChunk.subject.toLowerCase().includes('science') ||
    /[\d=+\-*/x]/.test(question) ||
    /solve|find|equation|formula|derive|calculate|ઉકેલો|સમીકરણ/i.test(question);

  // 5. Generate Grounded Response (via Gemini if available, else local deterministic synthesis)
  let generatedAnswer = '';
  let stepByStepSolution: StepItem[] | undefined = undefined;

  const geminiResponse = await generateGroundedAnswerWithGemini(
    question,
    topCitations,
    language,
    isMathOrScience
  );

  if (geminiResponse) {
    generatedAnswer = geminiResponse.answer;
    stepByStepSolution = geminiResponse.stepByStep;
  } else {
    // Local pedagogical synthesis strictly quoting authorized NCERT text
    if (isGu) {
      generatedAnswer = `### 📘 NCERT પ્રમાણિત ઉત્તર (${primaryChunk.board} - ${primaryChunk.standard} ${primaryChunk.subject})\n\n`;
      generatedAnswer += `${primaryChunk.excerpt}\n\n`;
      if (topCitations.length > 1) {
        generatedAnswer += `**સહાયક ખ્યાલો અને નિયમો:**\n`;
        for (const c of topCitations.slice(1)) {
          generatedAnswer += `- **${c.sectionName || c.topicName || 'પ્રકરણ સંદર્ભ'}:** ${c.excerpt.split('.')[0]}.\n`;
        }
      }
    } else if (isHi) {
      generatedAnswer = `### 📘 एनसीईआरटी प्रमाणित उत्तर (${primaryChunk.board} - ${primaryChunk.standard} ${primaryChunk.subject})\n\n`;
      generatedAnswer += `${primaryChunk.excerpt}\n\n`;
      if (topCitations.length > 1) {
        generatedAnswer += `**सहायक अवधारणाएँ और सूत्र:**\n`;
        for (const c of topCitations.slice(1)) {
          generatedAnswer += `- **${c.sectionName || c.topicName || 'अध्याय संदर्भ'}:** ${c.excerpt.split('.')[0]}.\n`;
        }
      }
    } else {
      generatedAnswer = `### 📘 NCERT-Verified Answer (${primaryChunk.board} - ${primaryChunk.standard} ${primaryChunk.subject})\n\n`;
      generatedAnswer += `${primaryChunk.excerpt}\n\n`;
      if (topCitations.length > 1) {
        generatedAnswer += `**Key Textbook Concepts & Rules:**\n`;
        for (const c of topCitations.slice(1)) {
          generatedAnswer += `- **${c.sectionName || c.topicName || 'Chapter Section'}:** ${c.excerpt.split('.')[0]}.\n`;
        }
      }
    }

    // Step-by-step breakdown for Math and Science
    if (isMathOrScience) {
      stepByStepSolution = [
        {
          stepNumber: 1,
          title: isGu ? 'NCERT ખ્યાલ અને સૂત્ર ઓળખો' : isHi ? 'एनसीईआरटी संकल्पना और सूत्र' : 'Identify NCERT Concept & Formula',
          description: isGu
            ? `પાઠ્યપુસ્તકના ${primaryChunk.sectionName || primaryChunk.topicName || 'વિભાગ'} મુજબ સંબંધિત પદો અને વ્યાખ્યા લાગુ કરો.`
            : `Refer to ${primaryChunk.sectionName || primaryChunk.topicName || 'Textbook Section'} for definition and core formula.`,
          ncertConceptLink: `${primaryChunk.chapterName} (Page ${primaryChunk.pageNumber})`
        },
        {
          stepNumber: 2,
          title: isGu ? 'ગાણિતિક અથવા વૈજ્ઞાનિક ક્રિયા' : isHi ? 'गणना एवं चरणबद्ध प्रक्रिया' : 'Step-by-Step Procedure & Working',
          description: isGu
            ? 'બંને બાજુ પદોનું પક્ષાંતર અથવા રાસાયણિક સમીકરણનું સંતુલન કરો.'
            : 'Transpose terms or balance chemical equations maintaining mathematical equality.',
          ncertConceptLink: primaryChunk.textbookTitle
        },
        {
          stepNumber: 3,
          title: isGu ? 'અંતિમ પ્રમાણિત પરિણામ' : isHi ? 'अंतिम परिणाम एवं निष्कर्ष' : 'Verified Conclusion',
          description: isGu
            ? 'ઉકેલ મેળવીને પાઠ્યપુસ્તકના નિયમ અનુસાર તેની ચકાસણી કરો.'
            : 'Obtain final value and verify against the conditions specified in NCERT.',
          ncertConceptLink: `NCERT ${primaryChunk.standard} ${primaryChunk.subject}`
        }
      ];
    }
  }

  // Append Source Verification block
  generatedAnswer += `\n\n---\n**Source Verification:**\n${sourceVerificationStr}`;

  const chunkIds = topCitations.map(c => c.id).join(',');

  // 6. Record audit log for traceability
  const audit = await prisma.ncertQueryAudit.create({
    data: {
      userId: userId || null,
      question,
      answer: generatedAnswer,
      isGrounded: true,
      groundingStatus: 'VERIFIED',
      relevanceScore: primaryChunk.score,
      board: primaryChunk.board,
      standard: primaryChunk.standard,
      subject: primaryChunk.subject,
      citationsJson: JSON.stringify(topCitations),
      sourceChunkIds: chunkIds
    }
  });

  return {
    question,
    answer: generatedAnswer,
    isGrounded: true,
    relevanceScore: primaryChunk.score,
    board: primaryChunk.board,
    citations: topCitations,
    groundingStatus: 'VERIFIED',
    sourceVerification: sourceVerificationStr,
    stepByStepSolution,
    sourceChunkIds: topCitations.map(c => c.id),
    auditId: audit.id
  };
}
