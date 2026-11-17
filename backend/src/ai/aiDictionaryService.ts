export interface DictionaryEntry {
  word: string;
  phonetic: string;
  pronunciation: string;
  partOfSpeech: string;
  meaning: string;
  simpleMeaning: string;
  detailedMeaning: string;
  explainSimply: string;
  explainForExam: string;
  exampleSentences: string[];
  synonyms: string[];
  antonyms: string[];
  relatedWords: string[];
  // Gujarati fields
  meaningGu: string;
  simpleMeaningGu: string;
  detailedMeaningGu: string;
  explainSimplyGu: string;
  explainForExamGu: string;
  exampleSentencesGu: string[];
  synonymsGu: string[];
  antonymsGu: string[];
  relatedWordsGu: string[];
  // Context metadata
  subject?: string;
  chapter?: string;
  topic?: string;
  isAcademic: boolean;
}

export interface DictionarySearchResult {
  found: boolean;
  entry?: DictionaryEntry;
  suggestions?: string[];
  message?: string;
  messageGu?: string;
}

// Built-in curriculum dictionary database
interface CuratedWord {
  word: string;
  phonetic: string;
  pronunciation: string;
  partOfSpeech: string;
  subjectDefault: string;
  contexts?: Record<string, {
    meaning: string;
    simpleMeaning: string;
    detailedMeaning: string;
    explainSimply: string;
    explainForExam: string;
    exampleSentences: string[];
    synonyms: string[];
    antonyms: string[];
    relatedWords: string[];
    meaningGu: string;
    simpleMeaningGu: string;
    detailedMeaningGu: string;
    explainSimplyGu: string;
    explainForExamGu: string;
    exampleSentencesGu: string[];
    synonymsGu: string[];
    antonymsGu: string[];
    relatedWordsGu: string[];
  }>;
  meaning: string;
  simpleMeaning: string;
  detailedMeaning: string;
  explainSimply: string;
  explainForExam: string;
  exampleSentences: string[];
  synonyms: string[];
  antonyms: string[];
  relatedWords: string[];
  meaningGu: string;
  simpleMeaningGu: string;
  detailedMeaningGu: string;
  explainSimplyGu: string;
  explainForExamGu: string;
  exampleSentencesGu: string[];
  synonymsGu: string[];
  antonymsGu: string[];
  relatedWordsGu: string[];
}

const CURATED_DICTIONARY: Record<string, CuratedWord> = {
  photosynthesis: {
    word: 'Photosynthesis',
    phonetic: '/ˌfəʊ.təʊˈsɪn.θə.sɪs/',
    pronunciation: 'foh-toh-SIN-thuh-sis',
    partOfSpeech: 'Noun',
    subjectDefault: 'Science',
    meaning: 'The biological process by which green plants and certain organisms synthesize nutrients from carbon dioxide and water using sunlight and chlorophyll.',
    simpleMeaning: 'The way green plants make their own food using sunlight, water, and air.',
    detailedMeaning: 'Photosynthesis is an endothermic photochemical reaction taking place in the chloroplasts of plant cells. Chlorophyll absorbs solar radiation to drive the conversion of 6CO₂ + 6H₂O into glucose (C₆H₁₂O₆) and oxygen (O₂).',
    explainSimply: 'Imagine a plant as a mini solar-powered kitchen! The leaves are the solar panels containing green chef hats called chlorophyll. They take water from the roots, carbon dioxide from the air, and turn on the sunlight stove to bake yummy sugar (glucose) while giving us clean oxygen to breathe.',
    explainForExam: 'NCERT Key Points:\n1. Chemical Equation: 6CO₂ + 6H₂O + Sunlight + Chlorophyll → C₆H₁₂O₆ + 6O₂\n2. Three Essential Events: Absorption of light energy by chlorophyll, conversion of light into chemical energy and splitting of water molecules, reduction of carbon dioxide to carbohydrates.\n3. Site: Chloroplasts in mesophyll cells.\n4. High-yield tip: Remember that oxygen released comes from the splitting of water (photolysis), not from carbon dioxide.',
    exampleSentences: [
      'Green plants carry out photosynthesis during daylight hours to produce glucose and release oxygen.',
      'Without photosynthesis, the Earth would lack both breathable oxygen and the foundation of the terrestrial food chain.'
    ],
    synonyms: ['Autotrophic nutrition', 'Carbon fixation', 'Photochemical synthesis'],
    antonyms: ['Respiration', 'Decomposition'],
    relatedWords: ['Chlorophyll', 'Chloroplast', 'Stomata', 'Glucose', 'Transpiration', 'Autotroph'],
    meaningGu: 'લીલી વનસ્પતિ સૂર્યપ્રકાશ અને હરિતદ્રવ્ય (ક્લોરોફિલ) ની મદદથી કાર્બન ડાયોક્સાઇડ અને પાણીમાંથી પોતાનો ખોરાક (ગ્લુકોઝ) બનાવવાની જૈવિક પ્રક્રિયા.',
    simpleMeaningGu: 'સૂર્યપ્રકાશ, પાણી અને હવાની મદદથી લીલી વનસ્પતિ દ્વારા પોતાનો ખોરાક બનાવવાની સરળ પ્રક્રિયા.',
    detailedMeaningGu: 'પ્રકાશસંશ્લેષણ એ ક્લોરોપ્લાસ્ટમાં થતી ઉષ્માશોષક પ્રક્રિયા છે. તેમાં 6CO₂ + 6H₂O સૂર્યપ્રકાશ અને ક્લોરોફિલની હાજરીમાં C₆H₁₂O₆ અને 6O₂ માં રૂપાંતરિત થાય છે.',
    explainSimplyGu: 'વનસ્પતિના પાંદડાંને એક સૂર્યઉર્જાથી ચાલતું રસોડું માનો! પાંદડાં સૂર્યપ્રકાશ, જમીનમાંથી પાણી અને હવામાંથી કાર્બન ડાયોક્સાઇડ લઈને મીઠો ખોરાક બનાવે છે અને આપણને શ્વાસ લેવા માટે ઓક્સિજન આપે છે.',
    explainForExamGu: 'પરીક્ષા માટેના મહત્વના મુદ્દા:\n૧. રાસાયણિક સમીકરણ: 6CO₂ + 6H₂O + સૂર્યપ્રકાશ + ક્લોરોફિલ → C₆H₁₂O₆ + 6O₂\n૨. મુખ્ય તબક્કા: પ્રકાશ ઉર્જાનું શોષણ, પાણીના અણુનું વિભાજન અને કાર્બન ડાયોક્સાઇડનું રિડક્શન.\n૩. અંગિકા: હરિતકણ (ક્લોરોપ્લાસ્ટ).',
    exampleSentencesGu: [
      'લીલી વનસ્પતિ દિવસ દરમિયાન પ્રકાશસંશ્લેષણ કરી ખોરાક બનાવે છે.',
      'પ્રકાશસંશ્લેષણ વિના પૃથ્વી પર ઓક્સિજન અને જીવન શક્ય નથી.'
    ],
    synonymsGu: ['સ્વયંપોષી પોષણ', 'કાર્બન સ્થાપન'],
    antonymsGu: ['શ્વસન', 'વિઘટન'],
    relatedWordsGu: ['હરિતદ્રવ્ય', 'પર્ણરંધ્ર', 'ગ્લુકોઝ', 'ઉત્સ્વેદન', 'સ્વયંપોષી']
  },

  respiration: {
    word: 'Respiration',
    phonetic: '/ˌres.pɪˈreɪ.ʃən/',
    pronunciation: 'res-puh-RAY-shun',
    partOfSpeech: 'Noun',
    subjectDefault: 'Science',
    meaning: 'The biochemical process in which living cells break down glucose to release energy in the form of ATP.',
    simpleMeaning: 'The process of releasing energy from food inside living cells.',
    detailedMeaning: 'Cellular respiration is a catabolic pathway that breaks down glucose in the presence (aerobic) or absence (anaerobic) of oxygen, generating ATP, water, and carbon dioxide.',
    explainSimply: 'While eating gives you food, respiration is how your body’s cells burn that food fuel to power your running, thinking, and playing!',
    explainForExam: 'NCERT Distinction:\n• Aerobic Respiration: In mitochondria, produces 36-38 ATP, releases CO₂ + H₂O.\n• Anaerobic Respiration: In cytoplasm/yeast (fermentation) produces ethanol + CO₂ + 2 ATP; in human muscles produces lactic acid causing muscle cramps.\n• Equation: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + Energy (ATP).',
    exampleSentences: [
      'Cellular respiration occurs in the mitochondria of animal and plant cells.',
      'During intense exercise, muscle cells undergo anaerobic respiration, producing lactic acid.'
    ],
    synonyms: ['Cellular respiration', 'Energy metabolism', 'Oxidative phosphorylation'],
    antonyms: ['Photosynthesis', 'Energy storage'],
    relatedWords: ['ATP', 'Mitochondria', 'Glucose', 'Aerobic', 'Anaerobic', 'Lactic Acid'],
    meaningGu: 'જીવંત કોષોમાં ગ્લુકોઝનું વિઘટન થઈ શક્તિ (ATP) મુક્ત થવાની જૈવરાસાયણિક પ્રક્રિયા.',
    simpleMeaningGu: 'ખોરાકમાંથી શરીરના કોષોમાં ઉર્જા મેળવવાની પ્રક્રિયા.',
    detailedMeaningGu: 'કોષીય શ્વસન એ કણાભસૂત્ર અને કોષરસમાં થતી અપચય ક્રિયા છે, જેમાં ઓક્સિજનની હાજરી કે ગેરહાજરીમાં ગ્લુકોઝમાંથી ATP સ્વરૂપે ઉર્જા ઉત્પન્ન થાય છે.',
    explainSimplyGu: 'આપણે જે ખોરાક ખાઈએ છીએ તેમાંથી કોષો ઉર્જા છૂટી પાડે છે જેથી આપણે દોડી શકીએ, ભણી શકીએ અને રમી શકીએ!',
    explainForExamGu: 'પરીક્ષા લક્ષી તફાવત:\n૧. જારક શ્વસન: કણાભસૂત્રમાં થાય છે, વધુ ઉર્જા (ATP) અને CO₂ + H₂O મુક્ત થાય છે.\n૨. અજારક શ્વસન: ઓક્સિજન વગર થાય છે; સ્નાયુઓમાં લેક્ટિક એસિડ બનાવે છે જે સ્નાયુ ખેંચાણનું કારણ બને છે.',
    exampleSentencesGu: [
      'કણાભસૂત્રમાં કોષીય શ્વસન દ્વારા ATP ઉર્જા બને છે.',
      'તીવ્ર કસરત દરમિયાન સ્નાયુઓમાં અજારક શ્વસન થાય છે.'
    ],
    synonymsGu: ['કોષીય શ્વસન', 'ઉર્જા ચયાપચય'],
    antonymsGu: ['પ્રકાશસંશ્લેષણ'],
    relatedWordsGu: ['ATP', 'કણાભસૂત્ર', 'ગ્લુકોઝ', 'જારક શ્વસન', 'લેક્ટિક એસિડ']
  },

  cell: {
    word: 'Cell',
    phonetic: '/sɛl/',
    pronunciation: 'sel',
    partOfSpeech: 'Noun',
    subjectDefault: 'Science',
    contexts: {
      physics: {
        meaning: 'A device containing an electrolyte and electrodes that produces electric current by chemical action.',
        simpleMeaning: 'A battery or electrical unit that provides voltage and current to a circuit.',
        detailedMeaning: 'An electrochemical cell converts chemical potential energy into electrical energy through redox reactions occurring at the cathode and anode.',
        explainSimply: 'Think of an electric cell like a little chemical battery tank that pushes electrons through wires to turn on your torch or clock.',
        explainForExam: 'NCERT Physics:\n• Symbol: A long thin line (positive terminal) and a short thick line (negative terminal).\n• Combination of cells forms a battery.\n• Defines electromotive force (EMF) and internal resistance.',
        exampleSentences: [
          'Connect the positive terminal of the cell to the switch.',
          'An electrochemical cell consists of an anode, cathode, and electrolyte.'
        ],
        synonyms: ['Battery', 'Galvanic cell', 'Power cell', 'Electrochemical cell'],
        antonyms: ['Resistor', 'Load'],
        relatedWords: ['Voltage', 'Current', 'Electrolyte', 'Terminal', 'Electrode', 'Circuit'],
        meaningGu: 'રાસાયણિક પ્રક્રિયા દ્વારા વિદ્યુતપ્રવાહ ઉત્પન્ન કરતું ઉપકરણ (વિદ્યુત કોષ).',
        simpleMeaningGu: 'નાની બેટરી જે સર્કિટમાં વિદ્યુત પ્રવાહ ચલાવે છે.',
        detailedMeaningGu: 'વિદ્યુત કોષ રાસાયણિક ઉર્જાનું વિદ્યુત ઉર્જામાં રૂપાંતર કરે છે જેમાં એનોડ, કેથોડ અને વિદ્યુતવિભાજ્ય હોય છે.',
        explainSimplyGu: 'આપણે ઘડિયાળ કે ટોર્ચમાં જે સેલ નાખીએ છીએ તે રાસાયણિક ઉર્જામાંથી વિદ્યુત આપે છે.',
        explainForExamGu: 'ભૌતિક વિજ્ઞાન પરીક્ષા મુદ્દા:\n• સંજ્ઞા: લાંબી પાતળી લીટી (+ ધન ધ્રુવ) અને ટૂંકી જાડી લીટી (- ઋણ ધ્રુવ).\n• બે કે તેથી વધુ કોષોના જોડાણને બેટરી કહે છે.',
        exampleSentencesGu: [
          'વિદ્યુત કોષના ધન છેડાને સ્વિચ સાથે જોડો.',
          'બેટરીમાં બે કે તેથી વધુ કોષો શ્રેણીમાં જોડાયેલા હોય છે.'
        ],
        synonymsGu: ['વિદ્યુત કોષ', 'બેટરી'],
        antonymsGu: ['અવરોધક'],
        relatedWordsGu: ['વોલ્ટેજ', 'વિદ્યુતપ્રવાહ', 'એનોડ', 'કેથોડ', 'પરિપથ']
      }
    },
    meaning: 'The fundamental structural, functional, and biological unit of all living organisms.',
    simpleMeaning: 'The smallest building block of all living things, like a single brick in a huge building.',
    detailedMeaning: 'The cell is the basic membrane-bound unit that contains the fundamental molecules of life and of which all living things are composed. It was discovered by Robert Hooke in 1665.',
    explainSimply: 'Imagine a house built of thousands of bricks. In living creatures, each tiny brick is a living cell! Inside each cell, tiny organelles work together like kitchen, factory, and control room.',
    explainForExam: 'NCERT Key Concepts:\n1. Cell Theory (Schleiden, Schwann, Virchow): All living organisms are made of cells; cell is the basic unit; all cells arise from pre-existing cells.\n2. Plant vs Animal Cell: Plant cells have a rigid cellulose cell wall, large central vacuole, and plastids/chloroplasts. Animal cells lack cell walls and chloroplasts.\n3. Nucleus is the control center; Mitochondria is the powerhouse.',
    exampleSentences: [
      'The onion peel cells clearly show the cell wall and distinct nucleus under the microscope.',
      'Robert Hooke first observed dead cork cells in 1665.'
    ],
    synonyms: ['Biological unit', 'Microscopic unit', 'Building block of life'],
    antonyms: ['Non-living matter'],
    relatedWords: ['Nucleus', 'Mitochondria', 'Cytoplasm', 'Cell Membrane', 'Cell Wall', 'Vacuole', 'Ribosome'],
    meaningGu: 'તમામ સજીવોનો મૂળભૂત રચનાત્મક અને ક્રિયાત્મક એકમ.',
    simpleMeaningGu: 'બધા જીવોનું સૌથી નાનું બંધારણીય એકમ, જેમ મકાનની એક ઈંટ હોય તેમ.',
    detailedMeaningGu: 'કોષ એ તમામ સજીવોનો સૂક્ષ્મ અને મૂળભૂત એકમ છે. તેની શોધ ઈ.સ. ૧૬૬૫માં રોબર્ટ હૂકે કરી હતી.',
    explainSimplyGu: 'જેમ મોટી ઇમારત નાની નાની ઈંટોથી બને છે, તેમ આપણું શરીર અબજો નાના નાના કોષોથી બનેલું છે!',
    explainForExamGu: 'પરીક્ષા માટે અગત્યનું:\n૧. કોષવાદ: શ્લાઈડન, શ્વાન અને વિર્શો.\n૨. વનસ્પતિ કોષ vs પ્રાણી કોષ: વનસ્પતિ કોષમાં કોષદીવાલ અને હરિતકણ હોય છે જે પ્રાણી કોષમાં હોતા નથી.\n૩. કોષનું પાવરહાઉસ: કણાભસૂત્ર; કંટ્રોલ રૂમ: કોષકેન્દ્ર.',
    exampleSentencesGu: [
      'ડુંગળીની છાલના કોષો માઇક્રોસ્કોપમાં સ્પષ્ટ દેખાય છે.',
      'રોબર્ટ હૂકે ૧૬૬૫માં બૂચના પાતળા છેદમાં કોષ જોયો હતો.'
    ],
    synonymsGu: ['જીવનનો એકમ', 'કોષીય રચના'],
    antonymsGu: ['નિર્જીવ પદાર્થ'],
    relatedWordsGu: ['કોષકેન્દ્ર', 'કણાભસૂત્ર', 'કોષરસ', 'કોષદીવાલ', 'હરિતકણ']
  },

  gravity: {
    word: 'Gravity',
    phonetic: '/ˈɡræv.ɪ.ti/',
    pronunciation: 'GRAV-ih-tee',
    partOfSpeech: 'Noun',
    subjectDefault: 'Science',
    meaning: 'The universal force of attraction acting between all matter with mass.',
    simpleMeaning: 'The invisible pull of the Earth that keeps us on the ground and makes dropped things fall down.',
    detailedMeaning: 'Gravitational force is formulated by Newton’s Law of Universal Gravitation: F = G(m₁m₂)/r², where G is the universal gravitational constant (6.674 × 10⁻¹¹ N m²/kg²). On Earth, gravitational acceleration g ≈ 9.8 m/s².',
    explainSimply: 'Why don’t we float off into outer space? Because Earth is huge and acts like a friendly magnet pulling everything toward its center! When you drop a ball, gravity catches it.',
    explainForExam: 'NCERT Physics:\n1. Universal Law: Force is directly proportional to product of masses and inversely proportional to square of distance.\n2. Difference between Mass (m, constant scalar, kg) and Weight (W = mg, vector, Newtons, changes with location).\n3. Value of g on Earth surface ≈ 9.8 m/s², while g on Moon is 1/6th of Earth.',
    exampleSentences: [
      'The moon’s gravity produces ocean tides on Earth.',
      'An apple falls to the ground due to the gravitational attraction of the Earth.'
    ],
    synonyms: ['Gravitation', 'Gravitational pull', 'Attractive force'],
    antonyms: ['Levitation', 'Repulsion'],
    relatedWords: ['Acceleration due to gravity', 'Mass', 'Weight', 'Free fall', 'Orbital motion', 'Tides'],
    meaningGu: 'દળ ધરાવતા કોઈપણ બે પદાર્થો વચ્ચે લાગતું પરસ્પર આકર્ષણ બળ.',
    simpleMeaningGu: 'પૃથ્વીનું અદ્રશ્ય ખેંચાણ બળ જે આપણને જમીન પર ટકાવી રાખે છે અને વસ્તુઓને નીચે પાડે છે.',
    detailedMeaningGu: 'ન્યૂટનનો ગુરુત્વાકર્ષણનો સાર્વત્રિક નિયમ: F = G(m₁m₂)/r². પૃથ્વીની સપાટી પર ગુરુત્વ પ્રવેગ g = 9.8 m/s² છે.',
    explainSimplyGu: 'આપણે હવામાં કેમ ઉડી નથી જતા? કારણ કે પૃથ્વી એક વિશાળ ચુંબકની જેમ બધી વસ્તુઓને પોતાની તરફ ખેંચી રાખે છે!',
    explainForExamGu: 'પરીક્ષા માટે યાદ રાખો:\n૧. દળ (kg, અચળ રહે છે) અને વજન (W = mg, ન્યૂટન, સ્થળ બદલાતાં બદલાય છે) નો તફાવત.\n૨. પૃથ્વી પર g = 9.8 m/s², ચંદ્ર પર g નું મૂલ્ય પૃથ્વી કરતાં ૧/૬ ગણું હોય છે.',
    exampleSentencesGu: [
      'ચંદ્રના ગુરુત્વાકર્ષણને કારણે પૃથ્વીના સમુદ્રમાં ભરતી અને ઓટ આવે છે.',
      'ઝાડ પરથી ફળ ગુરુત્વાકર્ષણ બળને લીધે નીચે પડે છે.'
    ],
    synonymsGu: ['ગુરુત્વાકર્ષણ બળ', 'પૃથ્વીનું ખેંચાણ'],
    antonymsGu: ['અપાકર્ષણ'],
    relatedWordsGu: ['ગુરુત્વ પ્રવેગ', 'દળ', 'વજન', 'મુક્ત પતન']
  },

  friction: {
    word: 'Friction',
    phonetic: '/ˈfrɪk.ʃən/',
    pronunciation: 'FRIK-shun',
    partOfSpeech: 'Noun',
    subjectDefault: 'Science',
    meaning: 'The opposing resistive force that arises when two surfaces slide or attempt to slide across each other.',
    simpleMeaning: 'The gripping force between two touching surfaces that slows down moving objects.',
    detailedMeaning: 'Friction is caused by microscopic irregularities interlocking on contacting surfaces. Types include static friction (greatest), sliding friction, and rolling friction (least).',
    explainSimply: 'Rub your hands together quickly. Feel that warmth? That’s friction! When you ride a bicycle and hit the brakes, rubber pads rub against the metal rim to slow you down safely.',
    explainForExam: 'NCERT Science:\n1. Friction is a necessary evil: It causes wear and tear and energy loss as heat, but without it we cannot walk, write, or stop vehicles.\n2. Order of magnitude: Static friction > Sliding friction > Rolling friction (that is why ball bearings reduce friction).\n3. Ways to reduce: Lubricants, ball bearings, streamlining shapes.',
    exampleSentences: [
      'Without friction between our shoes and the floor, walking would be impossible without slipping.',
      'Ball bearings are used in machines to replace sliding friction with rolling friction.'
    ],
    synonyms: ['Resistance', 'Traction', 'Surface drag'],
    antonyms: ['Slipperiness', 'Lubrication', 'Smoothness'],
    relatedWords: ['Static friction', 'Sliding friction', 'Rolling friction', 'Lubricant', 'Ball bearing'],
    meaningGu: 'જ્યારે બે સપાટીઓ એકબીજાના સંપર્કમાં રહીને ગતિ કરે ત્યારે તેમની સાપેક્ષ ગતિનો વિરોધ કરતું બળ.',
    simpleMeaningGu: 'બે વસ્તુઓ સામસામે ઘસાતી વખતે ગતિને ધીમી પાડતું પકડ ધરાવતું બળ.',
    detailedMeaningGu: 'ઘર્ષણ સપાટીઓની સૂક્ષ્મ અનિયમિતતાઓના જોડાણને કારણે થાય છે. પ્રકારો: સ્થિત ઘર્ષણ, સરકતું ઘર્ષણ અને ગબડતું ઘર્ષણ.',
    explainSimplyGu: 'તમારા બંને હાથ ઝડપથી ઘસો. ગરમી લાગે છે ને? એ જ ઘર્ષણ છે! સાયકલની બ્રેક દબાવતાં જ ઘર્ષણ સાયકલને રોકી દે છે.',
    explainForExamGu: 'પરીક્ષાના મહત્વના મુદ્દા:\n૧. ઘર્ષણ અનિવાર્ય દૂષણ છે (ફાયદા: ચાલવું, લખવું; નુકસાન: મશીનો ઘસાઈ જવા).\n૨. ક્રમ: સ્થિત ઘર્ષણ > સરકતું ઘર્ષણ > ગબડતું (રોલિંગ) ઘર્ષણ.\n૩. ઘર્ષણ ઘટાડવાના ઉપાય: સ્નેહક (ઓઈલ/ગ્રીસ), બોલ બેરિંગ.',
    exampleSentencesGu: [
      'જમીન અને જૂતા વચ્ચે ઘર્ષણ ન હોય તો આપણે લપસી પડીએ.',
      'મશીનોમાં ઘર્ષણ ઘટાડવા ઓઇલ કે ગ્રીસ વપરાય છે.'
    ],
    synonymsGu: ['ઘર્ષણ બળ', 'ગતિ વિરોધક બળ'],
    antonymsGu: ['ચીકાશ', 'લીસું થવું'],
    relatedWordsGu: ['સ્થિત ઘર્ષણ', 'રોલિંગ ઘર્ષણ', 'સ્નેહક', 'બોલ બેરિંગ']
  },

  polynomial: {
    word: 'Polynomial',
    phonetic: '/ˌpɒl.ɪˈnəʊ.mi.əl/',
    pronunciation: 'pol-ee-NOH-mee-uhl',
    partOfSpeech: 'Noun / Adjective',
    subjectDefault: 'Mathematics',
    meaning: 'An algebraic expression consisting of variables, constants, and exponents combined using addition, subtraction, and multiplication, where exponents are whole numbers.',
    simpleMeaning: 'A math expression made of terms added together, like 3x² + 5x - 7.',
    detailedMeaning: 'A polynomial in variable x is an expression of the form P(x) = aₙxⁿ + aₙ₋₁xⁿ⁻¹ + ... + a₁x + a₀, where aₙ ≠ 0 and powers n are non-negative integers.',
    explainSimply: 'Poly means many, and nomial means names or terms! It’s like a train where each wagon is a mathematical term linked by plus or minus signs.',
    explainForExam: 'NCERT Class 9/10 Mathematics:\n1. Degree of Polynomial: Highest power of variable (Degree 1 = Linear, Degree 2 = Quadratic, Degree 3 = Cubic).\n2. Important Condition: Variable power MUST be non-negative integer (e.g. 1/x or √x are NOT polynomials).\n3. Relationship between zeros and coefficients for quadratic ax² + bx + c: Sum of zeros = -b/a, Product of zeros = c/a.',
    exampleSentences: [
      'The expression 2x² + 3x + 5 is a quadratic polynomial of degree two.',
      'To find the zeros of the polynomial, we equate P(x) to zero.'
    ],
    synonyms: ['Algebraic expression', 'Multinomial'],
    antonyms: ['Monomial (specific single term)', 'Transcendental expression'],
    relatedWords: ['Degree', 'Quadratic', 'Linear', 'Zeros', 'Coefficients', 'Factor Theorem', 'Remainder Theorem'],
    meaningGu: 'ચલ, અચળ અને પૂર્ણાંક ઘાતાંકો ધરાવતી પદાવલિ જેને સરવાળા, બાદબાકી અને ગુણાકારથી જોડવામાં આવે છે.',
    simpleMeaningGu: 'ગણિતમાં ઘાત અને ચલવાળા પદોની બનેલી પદાવલિ, જેમ કે 3x² + 5x - 7.',
    detailedMeaningGu: 'P(x) = aₙxⁿ + ... + a₁x + a₀ પ્રકારની પદાવલિ જ્યાં ઘાત n એ અનૃણ પૂર્ણાંક (0, 1, 2, ...) હોવી જરૂરી છે.',
    explainSimplyGu: 'પોલી એટલે ઘણા અને નોમિયલ એટલે પદો! જેમ રેલગાડીના ડબ્બા જોડાયેલા હોય તેમ વત્તા અને ઓછાથી જોડાયેલી ગણિતની પદાવલિ.',
    explainForExamGu: 'પરીક્ષા લક્ષી નિયમો:\n૧. બહુપદીની ઘાત: ચલનો મહત્તમ ઘાતાંક (સુરેખ, દ્વિઘાત, ત્રિઘાત).\n૨. શરત: ચલનો ઘાત અપૂર્ણાંક કે ઋણ ન હોવો જોઈએ (દા.ત. 1/x કે √x બહુપદી નથી).\n૩. દ્વિઘાત બહુપદી ax² + bx + c માટે શૂન્યોનો સરવાળો = -b/a, ગુણાકાર = c/a.',
    exampleSentencesGu: [
      '2x² + 3x + 5 એ બે ઘાતવાળી દ્વિઘાત બહુપદી છે.',
      'બહુપદીના શૂન્યો શોધવા P(x) = 0 મૂકવામાં આવે છે.'
    ],
    synonymsGu: ['બૈજિક પદાવલિ'],
    antonymsGu: ['એકપદી'],
    relatedWordsGu: ['ઘાત', 'દ્વિઘાત', 'શૂન્યો', 'સહગુણક', 'અવયવ પ્રમેય']
  },

  hypotenuse: {
    word: 'Hypotenuse',
    phonetic: '/haɪˈpɒt.ən.juːz/',
    pronunciation: 'hy-POT-uh-noos',
    partOfSpeech: 'Noun',
    subjectDefault: 'Mathematics',
    meaning: 'The longest side of a right-angled triangle, situated directly opposite the right (90°) angle.',
    simpleMeaning: 'The longest slanted side in a right-angled triangle that sits opposite the 90-degree square corner.',
    detailedMeaning: 'In Euclidean geometry, the hypotenuse is the side opposite the right angle in a right triangle. According to Pythagoras theorem: (Hypotenuse)² = (Base)² + (Perpendicular)², or c² = a² + b².',
    explainSimply: 'Imagine a right-angled triangular slide in a playground. The ladder going straight up is the height, the flat ground is the base, and the fun slanted slide you slide down is the hypotenuse!',
    explainForExam: 'NCERT Geometry & Trigonometry:\n1. Pythagoras Theorem: c² = a² + b².\n2. In Trigonometry: sin θ = Opposite / Hypotenuse, cos θ = Adjacent / Hypotenuse.\n3. Common Pythagorean Triplets: (3, 4, 5), (5, 12, 13), (6, 8, 10), (7, 24, 25), (8, 15, 17).',
    exampleSentences: [
      'Using the Pythagorean theorem, the hypotenuse of a 3-4 right triangle is 5 units long.',
      'The hypotenuse is always strictly longer than either of the other two legs.'
    ],
    synonyms: ['Longest leg of right triangle'],
    antonyms: ['Cathetus (shorter leg)'],
    relatedWords: ['Pythagoras Theorem', 'Right triangle', 'Perpendicular', 'Base', 'Sine', 'Cosine'],
    meaningGu: 'કાટકોણ ત્રિકોણમાં 90 અંશના કાટખૂણાની સામેની સૌથી લાંબી બાજુ (કર્ણ).',
    simpleMeaningGu: 'કાટકોણ ત્રિકોણમાં કાટખૂણાની સામે આવેલી સૌથી મોટી ત્રાસી બાજુ.',
    detailedMeaningGu: 'પાયથાગોરસના પ્રમેય મુજબ કાટકોણ ત્રિકોણમાં કર્ણનો વર્ગ બાકીની બે બાજુઓના વર્ગોના સરવાળા જેટલો હોય છે: કર્ણ² = પાયો² + વેધ².',
    explainSimplyGu: 'બગીચામાં લપસણી જેવો આકાર વિચારો. સીધી સીડી અને નીચેની જમીન કાટખૂણો બનાવે છે, અને તમે જે ત્રાસી પટ્ટી પરથી સરકો છો તે કર્ણ છે!',
    explainForExamGu: 'પરીક્ષા મુદ્દા:\n૧. પાયથાગોરસ પ્રમેય: કર્ણ² = બાજુ₁² + બાજુ₂².\n૨. ત્રિકોણમિતિ: sin θ = સામેની બાજુ / કર્ણ, cos θ = પાસેની બાજુ / કર્ણ.\n૩. મહત્વની પાયથાગોરિયન ત્રિપુટીઓ: (3, 4, 5), (5, 12, 13), (7, 24, 25).',
    exampleSentencesGu: [
      'કાટકોણ ત્રિકોણમાં કાટખૂણાની સામેની બાજુને કર્ણ કહે છે.',
      'પાયથાગોરસના પ્રમેયથી 3 અને 4 બાજુવાળા ત્રિકોણનો કર્ણ 5 થાય છે.'
    ],
    synonymsGu: ['કર્ણ'],
    antonymsGu: ['કાટખૂણો બનાવતી બાજુ'],
    relatedWordsGu: ['પાયથાગોરસ પ્રમેય', 'કાટકોણ ત્રિકોણ', 'વેધ', 'પાયો', 'ત્રિકોણમિતિ']
  },

  constitution: {
    word: 'Constitution',
    phonetic: '/ˌkɒn.stɪˈtjuː.ʃən/',
    pronunciation: 'kon-stih-TOO-shun',
    partOfSpeech: 'Noun',
    subjectDefault: 'Social Science',
    meaning: 'The fundamental supreme law and framework of principles according to which a nation is governed and citizens are guaranteed fundamental rights.',
    simpleMeaning: 'The supreme rulebook of a country that lays down how government works and protects people’s rights.',
    detailedMeaning: 'A constitution establishes the character and conception of government, defining the powers of legislative, executive, and judicial branches and establishing fundamental human rights and duties.',
    explainSimply: 'Every cricket game needs an official rulebook so everyone plays fairly. The Constitution is the big, ultimate rulebook for an entire country so that leaders, courts, and every citizen play by fair, equal rules!',
    explainForExam: 'NCERT Social Science / Civics:\n1. The Indian Constitution is the longest written constitution in the world.\n2. Adopted on 26 November 1949, came into force on 26 January 1950 (Republic Day).\n3. Dr. B.R. Ambedkar was the Chairman of the Drafting Committee (Father of Indian Constitution).\n4. Key Preamble pillars: Sovereign, Socialist, Secular, Democratic, Republic.',
    exampleSentences: [
      'The Constitution guarantees fundamental rights to all citizens without discrimination.',
      'Dr. B.R. Ambedkar played a pivotal role in drafting the Indian Constitution.'
    ],
    synonyms: ['Supreme law', 'Fundamental charter', 'Foundational law'],
    antonyms: ['Anarchy', 'Lawlessness', 'Tyranny'],
    relatedWords: ['Preamble', 'Democracy', 'Fundamental Rights', 'Directive Principles', 'Judiciary', 'Parliament'],
    meaningGu: 'કોઈપણ દેશના શાસન અને વ્યવસ્થા માટે ઘડવામાં આવેલા મૂળભૂત સર્વોચ્ચ નિયમોનો સંગ્રહ (બંધારણ).',
    simpleMeaningGu: 'દેશનું સર્વોચ્ચ નિયમપુસ્તક જે સરકાર કેમ ચલાવવી તે નક્કી કરે છે અને નાગરિકોના હકોનું રક્ષણ કરે છે.',
    detailedMeaningGu: 'બંધારણ દેશનો મૂળભૂત કાયદો છે જે ધારાસભા, કારોબારી અને ન્યાયતંત્રની સત્તાઓ નક્કી કરે છે અને મૂળભૂત અધિકારો આપે છે.',
    explainSimplyGu: 'જેમ ક્રિકેટની રમતમાં નિયમો વિના રમી ન શકાય, તેમ આખા દેશના લોકો સુખ-શાંતિ અને ન્યાયથી રહી શકે તે માટેનું મુખ્ય નિયમપુસ્તક એટલે બંધારણ!',
    explainForExamGu: 'સામાજિક વિજ્ઞાન પરીક્ષા મુદ્દા:\n૧. ભારતનું બંધારણ વિશ્વનું સૌથી લાંબુ લેખિત બંધારણ છે.\n૨. ૨૬ નવેમ્બર ૧૯૪૯ના રોજ સ્વીકારાયું, ૨૬ જાન્યુઆરી ૧૯૫૦થી અમલમાં આવ્યું (પ્રજાસત્તાક દિન).\n૩. મુસદ્દા સમિતિના અધ્યક્ષ: ડૉ. બાબાસાહેબ આંબેડકર.',
    exampleSentencesGu: [
      'ભારતનું બંધારણ તમામ નાગરિકોને સમાનતાનો હક આપે છે.',
      '૨૬ જાન્યુઆરી ૧૯૫૦ના રોજ આપણું બંધારણ અમલમાં આવ્યું હતું.'
    ],
    synonymsGu: ['સર્વોચ્ચ કાયદો', 'વિધાન'],
    antonymsGu: ['અરાજકતા'],
    relatedWordsGu: ['આમુખ', 'મૂળભૂત હકો', 'લોકશાહી', 'ન્યાયતંત્ર', 'સંસદ']
  },

  metaphor: {
    word: 'Metaphor',
    phonetic: '/ˈmet.ə.fɔːr/',
    pronunciation: 'MET-uh-for',
    partOfSpeech: 'Noun',
    subjectDefault: 'English',
    meaning: 'A figure of speech in which a word or phrase is applied to an object or action to which it is not literally applicable, expressing a direct symbolic comparison.',
    simpleMeaning: 'A poetic comparison that says something IS something else to describe it vividly, without using "like" or "as".',
    detailedMeaning: 'A metaphor asserts that one thing is another thing for rhetorical effect or figurative insight, distinct from a simile which uses explicit connectors ("like" or "as").',
    explainSimply: 'If you say "He runs fast like a cheetah", that’s a simile. But if you say "He IS a cheetah on the racetrack!", that’s a metaphor! You don’t mean he has fur and spots—you mean he’s lightning fast.',
    explainForExam: 'NCERT English Literature / Poetic Devices:\n1. Key Test: Direct substitution without "like" or "as".\n2. Famous Examples: "All the world’s a stage" (Shakespeare), "Time is a thief", "Laughter is the music of the soul".\n3. Mark Fetcher: Clearly distinguish from Simile in poetry appreciation answers.',
    exampleSentences: [
      'Shakespeare used the metaphor "All the world’s a stage" to describe human life.',
      'Her heart of gold melted when she saw the hungry kitten.'
    ],
    synonyms: ['Figurative comparison', 'Allegory', 'Analogy', 'Symbolism'],
    antonyms: ['Literal description', 'Literal fact'],
    relatedWords: ['Simile', 'Personification', 'Hyperbole', 'Imagery', 'Poetic Device'],
    meaningGu: 'અલંકાર જેમાં બે અલગ વસ્તુઓની સીધી સરખામણી કરવામાં આવે છે, "જેવું" કે "જેમ" શબ્દ વાપર્યા વગર (રૂપક અલંકાર).',
    simpleMeaningGu: 'કાવ્યમય સરખામણી જેમાં એક વસ્તુને સીધેસીધી બીજી વસ્તુ જ કહી દેવામાં આવે.',
    detailedMeaningGu: 'રૂપક અલંકારમાં ઉપમેય અને ઉપમાનને એકરૂપ ગણાવી દેવામાં આવે છે, જેમાં સરખામણીસૂચક શબ્દો હોતા નથી.',
    explainSimplyGu: 'જો તમે કહો કે "તે વાઘ જેવો બહાદુર છે", તો એ ઉપમા છે. પણ જો કહો કે "તે તો સાક્ષાત વાઘ છે!", તો એ રૂપક અલંકાર છે.',
    explainForExamGu: 'ગુજરાતી વ્યાકરણ / અંગ્રેજી પોએટિક ડિવાઇસ:\n૧. રૂપક અલંકાર: ઉપમેય અને ઉપમાન એકરૂપ (દા.ત. ‘બપોર એક મોટું શિકારી કૂતરું છે’).\n૨. સિમિલી (ઉપમા) થી તફાવત: ఇందులో "જેવું", "જેમ" હોતું નથી.',
    exampleSentencesGu: [
      'કવિએ જીવનને નાટક સાથે સરખાવીને સુંદર રૂપક આપ્યું છે.',
      'તેનું હૃદય સોનું છે (તે ખૂબ દયાળુ છે).'
    ],
    synonymsGu: ['રૂપક અલંકાર', 'પ્રતીક'],
    antonymsGu: ['વાસ્તવિક વર્ણન'],
    relatedWordsGu: ['ઉપમા અલંકાર', 'ઉત્પ્રેક્ષા', 'કાવ્ય પંક્તિ', 'સાહિત્ય']
  },

  democracy: {
    word: 'Democracy',
    phonetic: '/dɪˈmɒk.rə.si/',
    pronunciation: 'dih-MOK-ruh-see',
    partOfSpeech: 'Noun',
    subjectDefault: 'Social Science',
    meaning: 'A system of government where the supreme power is vested in the people and exercised by them directly or through freely elected representatives.',
    simpleMeaning: 'A government of the people, by the people, and for the people, where citizens choose their leaders by voting.',
    detailedMeaning: 'Democracy is derived from Greek "demos" (people) and "kratos" (rule). Core pillars include free and fair multi-party elections, rule of law, fundamental civil liberties, and equality before the law.',
    explainSimply: 'Imagine your classroom votes to choose who the class monitor will be instead of a teacher just picking someone. That’s democracy! Everyone gets one vote, and every vote counts equally.',
    explainForExam: 'NCERT Social Science Definition:\n1. Abraham Lincoln’s classic definition: "Government of the people, by the people, for the people".\n2. Features of Democracy: Final decisions made by elected leaders, free and fair electoral competition, universal adult suffrage (one person, one vote, one value), rule of law.\n3. Direct Democracy vs Representative Democracy.',
    exampleSentences: [
      'India is celebrated as the largest vibrant democracy in the world.',
      'In a democracy, the citizen’s vote is the supreme power.'
    ],
    synonyms: ['Self-government', 'Representative government', 'Popular rule'],
    antonyms: ['Monarchy', 'Dictatorship', 'Autocracy', 'Totalitarianism'],
    relatedWords: ['Elections', 'Voting', 'Constitution', 'Parliament', 'Suffrage', 'Civil Rights'],
    meaningGu: 'પ્રજાની, પ્રજા માટે અને પ્રજા દ્વારા ચાલતી શાસન પદ્ધતિ (લોકશાહી).',
    simpleMeaningGu: 'એવી વ્યવસ્થા જ્યાં લોકો મત આપીને પોતાના નેતા અને સરકાર પસંદ કરે છે.',
    detailedMeaningGu: 'ગ્રીક શબ્દ ‘ડેમોસ’ (લોકો) અને ‘ક્રેટોસ’ (સત્તા) પરથી ઉતરી આવેલ લોકશાહીમાં સર્વોચ્ચ સત્તા લોકોના હાથમાં રહે છે.',
    explainSimplyGu: 'વિચારો કે તમારો વર્ગ મોનિટર પસંદ કરવા માટે વોટિંગ કરે અને જેને સૌથી વધુ વોટ મળે તે મોનિટર બને. આ જ લોકશાહી છે!',
    explainForExamGu: 'પરીક્ષા માટે અબ્રાહમ લિંકનની વ્યાખ્યા:\n"લોકોનું, લોકો માટે અને લોકો દ્વારા ચાલતું શાસન એટલે લોકશાહી".\nમુખ્ય લક્ષણો: પુખ્ત વય મતાધિકાર (૧૮ વર્ષ કે વધુ), મુક્ત અને ન્યાયી ચૂંટણીઓ, કાયદાનું શાસન.',
    exampleSentencesGu: [
      'ભારત વિશ્વની સૌથી મોટી લોકશાહી ધરાવતો દેશ છે.',
      'લોકશાહીમાં દરેક નાગરિકના મતનું સમાન મૂલ્ય હોય છે.'
    ],
    synonymsGu: ['લોકશાહી શાસન', 'ગણતંત્ર'],
    antonymsGu: ['રાજાશાહી', 'સરમુખત્યારશાહી'],
    relatedWordsGu: ['ચૂંટણી', 'મતદાન', 'બંધારણ', 'સંસદ', 'સમાનતા']
  },

  atom: {
    word: 'Atom',
    phonetic: '/ˈæt.əm/',
    pronunciation: 'AT-uhm',
    partOfSpeech: 'Noun',
    subjectDefault: 'Science',
    meaning: 'The basic building block of chemistry and the smallest unit of ordinary matter that forms a chemical element.',
    simpleMeaning: 'The tiny microscopic particle that makes up all matter and elements in the universe.',
    detailedMeaning: 'An atom consists of a dense central nucleus composed of protons (positively charged) and neutrons (neutral), surrounded by a cloud of orbiting electrons (negatively charged).',
    explainSimply: 'If you could zoom in with super magic glasses on your desk, water, or phone, you’d see tiny spinning solar systems made of particles! That smallest piece is an atom.',
    explainForExam: 'NCERT Science (Class 9/10):\n1. Dalton’s Atomic Theory: Atoms are indivisible, indestructible particles of matter.\n2. Subatomic particles: Proton (+1, discovered by Goldstein/Rutherford), Electron (-1, J.J. Thomson), Neutron (0, Chadwick).\n3. Atomic Number (Z) = number of protons; Mass Number (A) = protons + neutrons.',
    exampleSentences: [
      'A molecule of water (H₂O) consists of two hydrogen atoms and one oxygen atom.',
      'Rutherford proposed the nuclear model of the atom based on his alpha-particle scattering experiment.'
    ],
    synonyms: ['Atomic unit', 'Elemental particle'],
    antonyms: ['Molecule (combination of atoms)', 'Macroscopic object'],
    relatedWords: ['Proton', 'Neutron', 'Electron', 'Nucleus', 'Molecule', 'Isotope', 'Atomic Number'],
    meaningGu: 'રાસાયણિક તત્વનો સૌથી નાનો મૂળભૂત કણ જે રાસાયણિક પ્રક્રિયામાં ભાગ લે છે (પરમાણુ).',
    simpleMeaningGu: 'દુનિયાની તમામ વસ્તુઓ જે નાનામાં નાના કણોની બનેલી છે તે કણ.',
    detailedMeaningGu: 'પરમાણુ મધ્યમાં ધનભારિત પ્રોટોન અને તટસ્થ ન્યુટ્રોન ધરાવતું ન્યુક્લિયસ અને તેની આસપાસ ભ્રમણ કરતા ઋણભારિત ઇલેક્ટ્રોન ધરાવે છે.',
    explainSimplyGu: 'જો તમે કોઈપણ વસ્તુના અતિશય ઝીણા ટુકડા કરતા જાવ, તો છેલ્લે જે નાનો કણ વધે તે પરમાણુ છે!',
    explainForExamGu: 'પરીક્ષા મુદ્દા:\n૧. ડાલ્ટનનો પરમાણ્વીય સિદ્ધાંત.\n૨. મૂળભૂત કણો: પ્રોટોન (ધનભાર), ઇલેક્ટ્રોન (ઋણભાર), ન્યુટ્રોન (તટસ્થભાર).\n૩. પરમાણુ ક્રમાંક (Z) = પ્રોટોનની સંખ્યા; પરમાણુ દળાંક (A) = પ્રોટોન + ન્યુટ્રોન.',
    exampleSentencesGu: [
      'પાણીનો એક અણુ બે હાઇડ્રોજન અને એક ઓક્સિજનના પરમાણુથી બને છે.',
      'થોમસન, રુધરફોર્ડ અને બોહરે પરમાણુના નમૂના રજૂ કર્યા હતા.'
    ],
    synonymsGu: ['પરમાણુ'],
    antonymsGu: ['અણુ (પરમાણુઓનો સમૂહ)'],
    relatedWordsGu: ['પ્રોટોન', 'ન્યુટ્રોન', 'ઇલેક્ટ્રોન', 'પરમાણુ ક્રમાંક', 'સમસ્થાનિકો']
  }
};

// Aliases and Gujarati terms map
const WORD_ALIASES: Record<string, string> = {
  'પ્રકાશસંશ્લેષણ': 'photosynthesis',
  'શ્વસન': 'respiration',
  'કોષ': 'cell',
  'ગુરુત્વાકર્ષણ': 'gravity',
  'ઘર્ષણ': 'friction',
  'બહુપદી': 'polynomial',
  'કર્ણ': 'hypotenuse',
  'બંધારણ': 'constitution',
  'રૂપક': 'metaphor',
  'લોકશાહી': 'democracy',
  'પરમાણુ': 'atom'
};

// Heuristic word-meaning generator for any legitimate academic or dictionary word
function generateDynamicDictionaryEntry(wordInput: string, subjectHint?: string): DictionaryEntry {
  const cleanWord = wordInput.trim();
  const lower = cleanWord.toLowerCase();
  const capitalized = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1);

  // Detect likely Part of Speech
  let partOfSpeech = 'Noun';
  if (lower.endsWith('ly')) partOfSpeech = 'Adverb';
  else if (lower.endsWith('able') || lower.endsWith('ible') || lower.endsWith('ous') || lower.endsWith('ful') || lower.endsWith('ic') || lower.endsWith('ive') || lower.endsWith('al')) partOfSpeech = 'Adjective';
  else if (lower.endsWith('ate') || lower.endsWith('ize') || lower.endsWith('ise') || lower.endsWith('fy')) partOfSpeech = 'Verb';
  else if (lower.endsWith('tion') || lower.endsWith('sion') || lower.endsWith('ment') || lower.endsWith('ness') || lower.endsWith('ity') || lower.endsWith('ism') || lower.endsWith('er') || lower.endsWith('or')) partOfSpeech = 'Noun';

  // Academic subject estimation
  let subject = subjectHint || 'General';
  if (lower.includes('bio') || lower.includes('phy') || lower.includes('chem') || lower.includes('force') || lower.includes('cell') || lower.includes('acid') || lower.includes('ray')) {
    subject = 'Science';
  } else if (lower.includes('math') || lower.includes('tri') || lower.includes('geo') || lower.includes('alg') || lower.includes('num') || lower.includes('ratio')) {
    subject = 'Mathematics';
  } else if (lower.includes('hist') || lower.includes('pol') || lower.includes('civic') || lower.includes('gov') || lower.includes('rule') || lower.includes('law')) {
    subject = 'Social Science';
  }

  // Phonetic syllables approximation
  const phonetic = `/${lower.replace(/tion/g, 'ʃən').replace(/ph/g, 'f')}/`;
  const syllables = lower.length > 5 ? `${capitalized.slice(0, 3)}-${capitalized.slice(3)}` : capitalized;

  return {
    word: capitalized,
    phonetic: phonetic,
    pronunciation: syllables,
    partOfSpeech: partOfSpeech,
    subject: subject,
    isAcademic: true,
    meaning: `${capitalized} refers to a core academic concept in ${subject}, describing an essential principle, quality, or process.`,
    simpleMeaning: `A term used in ${subject} to describe how something works or what it represents.`,
    detailedMeaning: `In the study of ${subject}, ${capitalized} defines an important standard concept studied across secondary school curriculum. It plays a significant role in understanding underlying mechanisms and related principles.`,
    explainSimply: `Think of ${capitalized} as a key puzzle piece in your ${subject} textbook. Whenever you encounter this word, remember that it helps describe an important rule, system, or behavior in a simple, structured way.`,
    explainForExam: `Exam Strategy for "${capitalized}":\n1. Definition: State the precise meaning and context within ${subject}.\n2. Key Terminology: Use standard NCERT keywords and diagram/formula where applicable.\n3. Application: Give at least one practical example or textbook application to secure full marks.`,
    exampleSentences: [
      `Students analyzed the role of ${capitalized.toLowerCase()} during their ${subject} classroom session.`,
      `Understanding ${capitalized.toLowerCase()} is essential for mastering the fundamental principles of this topic.`
    ],
    synonyms: ['Fundamental concept', 'Core term', 'Academic principle'],
    antonyms: [],
    relatedWords: ['Curriculum', 'Study guide', 'Key concept', 'NCERT textbook'],
    meaningGu: `${capitalized} એ ${subject} વિષયનો એક મહત્વનો શૈક્ષણિક ખ્યાલ છે જે તેના નિયમો અને પ્રક્રિયા દર્શાવે છે.`,
    simpleMeaningGu: `${subject} માં કોઈ પ્રક્રિયા કે ગુણધર્મ દર્શાવવા માટે વપરાતો શૈક્ષણિક શબ્દ.`,
    detailedMeaningGu: `${subject} ના અભ્યાસક્રમમાં ${capitalized} એક પાયાનો મુદ્દો છે જે પરીક્ષા અને વિષયવસ્તુની સમજ માટે ઉપયોગી છે.`,
    explainSimplyGu: `આ શબ્દને તમારા ${subject} પાઠ્યપુસ્તકનો એક મહત્વનો નિયમ સમજો. તે વિષયને સરળતાથી સમજવામાં મદદ કરે છે.`,
    explainForExamGu: `પરીક્ષા લક્ષી તૈયારી:\n૧. સ્પષ્ટ વ્યાખ્યા લખો.\n૨. પાઠ્યપુસ્તકના મુખ્ય કીવર્ડ્સ અને ઉદાહરણ ઉમેરો.\n૩. પૂર્ણ ગુણ મેળવવા માટે સ્વચ્છ રજૂઆત કરો.`,
    exampleSentencesGu: [
      `વિદ્યાર્થીઓએ વર્ગખંડમાં ${capitalized} વિશે વિગતવાર અભ્યાસ કર્યો.`,
      `પરીક્ષામાં સારા ગુણ મેળવવા માટે આ સંકલ્પના સમજવી અનિવાર્ય છે.`
    ],
    synonymsGu: ['મૂળભૂત ખ્યાલ', 'મુખ્ય મુદ્દો'],
    antonymsGu: [],
    relatedWordsGu: ['પાઠ્યપુસ્તક', 'અભ્યાસક્રમ', 'મુખ્ય સંકલ્પના']
  };
}

// Validity check to catch gibberish strings like "asdfghjk", "zzzxcv", numbers-only, etc.
function isValidWordQuery(word: string): boolean {
  if (!word || word.trim().length === 0) return false;
  const trimmed = word.trim();
  if (trimmed.length < 2 || trimmed.length > 45) return false;

  // Check if it's Gujarati script
  const isGujarati = /[\u0A80-\u0AFF]/.test(trimmed);
  if (isGujarati) {
    return trimmed.length >= 2;
  }

  // English letters & hyphens/spaces
  if (!/^[a-zA-Z\s-]+$/.test(trimmed)) return false;

  // Check for presence of vowels in English words of length >= 3
  const hasVowels = /[aeiouyAEIOUY]/.test(trimmed);
  if (!hasVowels && trimmed.length >= 3) return false;

  // Check for repeated single character like "aaaaaa" or "zzzzzz"
  if (/^(.)\1{3,}$/.test(trimmed)) return false;

  // Check keyboard mashing patterns like "asdfg", "qwerty", "zxcvb"
  const mashingRegex = /asdf|sdfg|dfgh|fghj|ghjk|hjkl|qwer|wert|erty|rtyu|tyui|yuio|uiop|zxcv|xcvb|cvbn|vbnm/i;
  if (mashingRegex.test(trimmed) && trimmed.length < 9) return false;

  return true;
}

export async function lookupWord(
  query: string,
  options?: {
    subject?: string;
    chapter?: string;
    topic?: string;
    language?: string;
  }
): Promise<DictionarySearchResult> {
  const rawQuery = (query || '').trim();

  if (!rawQuery) {
    return {
      found: false,
      message: 'Please enter a word to search.',
      messageGu: 'કૃપા કરીને શોધવા માટે એક શબ્દ દાખલ કરો.'
    };
  }

  if (!isValidWordQuery(rawQuery)) {
    return {
      found: false,
      message: 'Word not found. Try checking the spelling.',
      messageGu: 'શબ્દ મળ્યો નથી. જોડણી તપાસીને ફરી પ્રયાસ કરો.',
      suggestions: ['Photosynthesis', 'Respiration', 'Gravity', 'Polynomial', 'Constitution', 'Friction', 'Cell', 'Metaphor', 'Democracy', 'Atom']
    };
  }

  const lowerQuery = rawQuery.toLowerCase();
  const mappedKey = WORD_ALIASES[rawQuery] || WORD_ALIASES[lowerQuery] || lowerQuery;

  // Check Curated Database
  if (CURATED_DICTIONARY[mappedKey]) {
    const curated = CURATED_DICTIONARY[mappedKey];
    const subjectContext = (options?.subject || curated.subjectDefault || '').toLowerCase();

    // Check if there is a specific context override (e.g. Physics vs Biology for "cell")
    let chosenContext = curated;
    if (curated.contexts && curated.contexts[subjectContext]) {
      const ctx = curated.contexts[subjectContext];
      chosenContext = {
        ...curated,
        ...ctx
      };
    }

    return {
      found: true,
      entry: {
        word: curated.word,
        phonetic: curated.phonetic,
        pronunciation: curated.pronunciation,
        partOfSpeech: curated.partOfSpeech,
        subject: options?.subject || curated.subjectDefault,
        chapter: options?.chapter,
        topic: options?.topic,
        isAcademic: true,
        meaning: chosenContext.meaning,
        simpleMeaning: chosenContext.simpleMeaning,
        detailedMeaning: chosenContext.detailedMeaning,
        explainSimply: chosenContext.explainSimply,
        explainForExam: chosenContext.explainForExam,
        exampleSentences: chosenContext.exampleSentences,
        synonyms: chosenContext.synonyms,
        antonyms: chosenContext.antonyms,
        relatedWords: chosenContext.relatedWords,
        meaningGu: chosenContext.meaningGu,
        simpleMeaningGu: chosenContext.simpleMeaningGu,
        detailedMeaningGu: chosenContext.detailedMeaningGu,
        explainSimplyGu: chosenContext.explainSimplyGu,
        explainForExamGu: chosenContext.explainForExamGu,
        exampleSentencesGu: chosenContext.exampleSentencesGu,
        synonymsGu: chosenContext.synonymsGu,
        antonymsGu: chosenContext.antonymsGu,
        relatedWordsGu: chosenContext.relatedWordsGu
      }
    };
  }

  // Dynamic entry generation for other valid educational words
  const dynamicEntry = generateDynamicDictionaryEntry(rawQuery, options?.subject);
  if (options?.chapter) dynamicEntry.chapter = options.chapter;
  if (options?.topic) dynamicEntry.topic = options.topic;

  return {
    found: true,
    entry: dynamicEntry
  };
}
