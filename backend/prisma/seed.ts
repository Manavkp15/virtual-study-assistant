import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

let databaseUrl = process.env.DATABASE_URL;
if (databaseUrl && databaseUrl.startsWith('postgres://')) {
  databaseUrl = databaseUrl.replace('postgres://', 'postgresql://');
  process.env.DATABASE_URL = databaseUrl;
}

const prisma = new PrismaClient({
  datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined
});

async function main() {
  console.log('🌱 Starting database seeding with bilingual support...');

  // Clean existing data in safe dependency order
  const safeDelete = async (modelDelegate: any, name: string) => {
    try {
      if (modelDelegate && typeof modelDelegate.deleteMany === 'function') {
        await modelDelegate.deleteMany();
      }
    } catch (e: any) {
      // Ignored if table is already empty or does not exist
    }
  };

  await safeDelete((prisma as any).dictionarySearch, 'dictionarySearch');
  await safeDelete((prisma as any).savedWord, 'savedWord');
  await safeDelete((prisma as any).dictionaryCache, 'dictionaryCache');
  await safeDelete((prisma as any).parentStudentMapping, 'parentStudentMapping');
  await safeDelete((prisma as any).parentProfile, 'parentProfile');
  await safeDelete((prisma as any).remedialSessionAnswer, 'remedialSessionAnswer');
  await safeDelete((prisma as any).remedialSession, 'remedialSession');
  await safeDelete((prisma as any).aiHomeworkCheck, 'aiHomeworkCheck');
  await safeDelete((prisma as any).homeworkAuditLog, 'homeworkAuditLog');
  await safeDelete((prisma as any).homeworkSubmissionHistory, 'homeworkSubmissionHistory');
  await safeDelete((prisma as any).questionEvaluation, 'questionEvaluation');
  await safeDelete((prisma as any).submissionPage, 'submissionPage');
  await safeDelete((prisma as any).homeworkSubmission, 'homeworkSubmission');
  await safeDelete((prisma as any).homeworkQuestion, 'homeworkQuestion');
  await safeDelete((prisma as any).homework, 'homework');
  await safeDelete((prisma as any).studyMaterialAccess, 'studyMaterialAccess');
  await safeDelete((prisma as any).studyMaterial, 'studyMaterial');
  await safeDelete((prisma as any).videoLectureAccess, 'videoLectureAccess');
  await safeDelete((prisma as any).videoLecture, 'videoLecture');
  await safeDelete((prisma as any).textbookChunk, 'textbookChunk');
  await safeDelete((prisma as any).textbookDocument, 'textbookDocument');
  await safeDelete((prisma as any).teacherSubjectMapping, 'teacherSubjectMapping');
  await safeDelete((prisma as any).teacherSubject, 'teacherSubject');
  await safeDelete((prisma as any).storedFile, 'storedFile');

  await safeDelete(prisma.achievement, 'achievement');
  await safeDelete(prisma.notification, 'notification');
  await safeDelete(prisma.studyTask, 'studyTask');
  await safeDelete(prisma.studyPlan, 'studyPlan');
  await safeDelete(prisma.mistakeBookEntry, 'mistakeBookEntry');
  await safeDelete(prisma.topicPerformance, 'topicPerformance');
  await safeDelete(prisma.studentAnswer, 'studentAnswer');
  await safeDelete(prisma.testAttempt, 'testAttempt');
  await safeDelete(prisma.testQuestion, 'testQuestion');
  await safeDelete(prisma.test, 'test');
  await safeDelete(prisma.questionOption, 'questionOption');
  await safeDelete(prisma.question, 'question');
  await safeDelete(prisma.topic, 'topic');
  await safeDelete(prisma.chapter, 'chapter');
  await safeDelete(prisma.subject, 'subject');
  await safeDelete(prisma.studentProfile, 'studentProfile');
  await safeDelete(prisma.user, 'user');

  // Create Users (only if explicitly enabled via SEED_DEMO_USERS=true)
  const shouldSeedUsers = process.env.SEED_DEMO_USERS === 'true';
  let studentUser: any = null;
  let teacherUser: any = null;
  let adminUser: any = null;

  if (shouldSeedUsers) {
    const passwordHash = await bcrypt.hash('password123', 10);
    const adminPasswordHash = await bcrypt.hash('admin123', 10);

    studentUser = await prisma.user.create({
      data: {
        email: 'student@example.com',
        passwordHash: passwordHash,
        name: 'Zain Patel',
        role: 'STUDENT',
        profile: {
          create: {
            availableHoursPerDay: 3.0,
            examDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            targetPercentage: 85.0,
            streakCount: 5,
            lastActiveDate: new Date()
          }
        }
      }
    });

    const teacherPasswordHash = await bcrypt.hash('teacher123', 10);

    teacherUser = await prisma.user.create({
      data: {
        email: 'teacher@example.com',
        passwordHash: teacherPasswordHash,
        name: 'Prof. Alex Vance',
        role: 'ADMIN'
      }
    });

    adminUser = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        passwordHash: adminPasswordHash,
        name: 'Admin User',
        role: 'ADMIN'
      }
    });

    console.log('👤 Users created: Student (student@example.com / password123), Teacher (teacher@example.com / teacher123)');
  } else {
    console.log('👤 Clean database mode: Skipping demo users, emails, passwords, and student profiles');
  }

  // Create Subjects (Standard-wise with Gujarati names)
  const math = await prisma.subject.create({
    data: {
      name: 'Mathematics',
      nameGu: 'ગણિત',
      code: 'MATH101',
      standard: 'Standard 8',
      icon: 'calculator',
      description: 'Algebra, Trigonometry, Calculus, Geometry & Statistics',
      descriptionGu: 'બીજગણિત, ત્રિકોણમિતિ, કલનશાસ્ત્ર, ભૂમિતિ અને આંકડાશાસ્ત્ર'
    }
  });

  const science = await prisma.subject.create({
    data: {
      name: 'Science',
      nameGu: 'વિજ્ઞાન',
      code: 'SCI101',
      standard: 'Standard 7',
      icon: 'flask-conical',
      description: 'Physics, Chemistry, Biology & Natural Sciences',
      descriptionGu: 'ભૌતિક વિજ્ઞાન, રસાયણ વિજ્ઞાન, જીવવિજ્ઞાન અને કુદરતી વિજ્ઞાન'
    }
  });

  const english = await prisma.subject.create({
    data: {
      name: 'English Language',
      nameGu: 'અંગ્રેજી ભાષા',
      code: 'ENG101',
      standard: 'Standard 6',
      icon: 'book-open',
      description: 'Grammar, Reading Comprehension, Vocabulary & Sentence Logic',
      descriptionGu: 'વ્યાકરણ, વાંચન સમજ, શબ્દભંડોળ અને વાક્ય રચના'
    }
  });

  // Math Chapters & Topics
  const mathCh1 = await prisma.chapter.create({
    data: { subjectId: math.id, name: 'Algebra', nameGu: 'બીજગણિત', order: 1 }
  });
  const tQuad = await prisma.topic.create({
    data: {
      chapterId: mathCh1.id,
      name: 'Quadratic Equations',
      nameGu: 'દ્વિઘાત સમીકરણો',
      description: 'Factoring, Discriminants & Roots',
      descriptionGu: 'અવયવીકરણ, વિવેચક અને બીજ'
    }
  });
  const tPoly = await prisma.topic.create({
    data: {
      chapterId: mathCh1.id,
      name: 'Polynomials',
      nameGu: 'બહુપદીઓ',
      description: 'Degrees, Expansion & Remainder Theorem',
      descriptionGu: 'ઘાત, વિસ્તરણ અને શેષ પ્રમેય'
    }
  });

  const mathCh2 = await prisma.chapter.create({
    data: { subjectId: math.id, name: 'Trigonometry', nameGu: 'ત્રિકોણમિતિ', order: 2 }
  });
  const tTrigId = await prisma.topic.create({
    data: {
      chapterId: mathCh2.id,
      name: 'Trigonometric Identities',
      nameGu: 'ત્રિકોણમિતીય નિત્યસમો',
      description: 'Sin, Cos, Tan, Pythagorean identities',
      descriptionGu: 'સાઇન, કોસ, ટેન, પાયથાગોરિયન નિત્યસમો'
    }
  });
  const tTrigHD = await prisma.topic.create({
    data: {
      chapterId: mathCh2.id,
      name: 'Heights and Distances',
      nameGu: 'ઊંચાઈ અને અંતર',
      description: 'Angles of Elevation & Depression',
      descriptionGu: 'ઉત્સેધકોણ અને અવસેધકોણ'
    }
  });

  const mathCh3 = await prisma.chapter.create({
    data: { subjectId: math.id, name: 'Calculus', nameGu: 'કલનશાસ્ત્ર', order: 3 }
  });
  const tLimits = await prisma.topic.create({
    data: {
      chapterId: mathCh3.id,
      name: 'Limits & Continuity',
      nameGu: 'લક્ષ અને સાતત્ય',
      description: 'Evaluating limits and checking continuity',
      descriptionGu: 'લક્ષ મૂલ્યાંકન અને સાતત્ય ચકાસણી'
    }
  });
  const tDiff = await prisma.topic.create({
    data: {
      chapterId: mathCh3.id,
      name: 'Differentiation',
      nameGu: 'વિકલન',
      description: 'Derivatives, Chain Rule, Rate of change',
      descriptionGu: 'વિકલિત, સાંકળ નિયમ, ફેરફારનો દર'
    }
  });

  // Science Chapters & Topics
  const sciCh1 = await prisma.chapter.create({
    data: { subjectId: science.id, name: 'Physics', nameGu: 'ભૌતિક વિજ્ઞાન', order: 1 }
  });
  const tNewton = await prisma.topic.create({
    data: {
      chapterId: sciCh1.id,
      name: 'Newton Laws of Motion',
      nameGu: 'ન્યૂટનના ગતિના નિયમો',
      description: 'Force, Mass, Acceleration, Inertia',
      descriptionGu: 'બળ, દળ, પ્રવેગ, જડત્વ'
    }
  });
  const tWork = await prisma.topic.create({
    data: {
      chapterId: sciCh1.id,
      name: 'Work & Energy',
      nameGu: 'કાર્ય અને ઊર્જા',
      description: 'Kinetic Energy, Potential Energy, Power',
      descriptionGu: 'ગતિ ઊર્જા, સ્થિતિ ઊર્જા, પાવર'
    }
  });

  const sciCh2 = await prisma.chapter.create({
    data: { subjectId: science.id, name: 'Chemistry', nameGu: 'રસાયણ વિજ્ઞાન', order: 2 }
  });
  const tChemReac = await prisma.topic.create({
    data: {
      chapterId: sciCh2.id,
      name: 'Chemical Reactions',
      nameGu: 'રાસાયણિક પ્રક્રિયાઓ',
      description: 'Balancing equations, Types of reactions',
      descriptionGu: 'સમીકરણ સંતુલન, પ્રક્રિયાઓના પ્રકાર'
    }
  });
  const tPeriodic = await prisma.topic.create({
    data: {
      chapterId: sciCh2.id,
      name: 'Periodic Table',
      nameGu: 'આવર્ત કોષ્ટક',
      description: 'Elements, Groups, Atomic Radius & Valence',
      descriptionGu: 'તત્વો, સમૂહો, પરમાણ્વીય ત્રિજ્યા અને સંયોજકતા'
    }
  });

  const sciCh3 = await prisma.chapter.create({
    data: { subjectId: science.id, name: 'Biology', nameGu: 'જીવવિજ્ઞાન', order: 3 }
  });
  const tCell = await prisma.topic.create({
    data: {
      chapterId: sciCh3.id,
      name: 'Cell Structure',
      nameGu: 'કોષ રચના',
      description: 'Organelles, Mitochondria, Cell Membrane',
      descriptionGu: 'અંગિકાઓ, કણાભસૂત્ર, કોષરસપટલ'
    }
  });

  // English Chapters & Topics
  const engCh1 = await prisma.chapter.create({
    data: { subjectId: english.id, name: 'Grammar', nameGu: 'વ્યાકરણ', order: 1 }
  });
  const tTenses = await prisma.topic.create({
    data: {
      chapterId: engCh1.id,
      name: 'Tenses & Verbs',
      nameGu: 'કાળ અને ક્રિયાપદો',
      description: 'Past, Present, Future Perfect Tenses',
      descriptionGu: 'ભૂતકાળ, વર્તમાનકાળ, ભવિષ્યકાળ અને પૂર્ણ કાળ'
    }
  });
  const tVoice = await prisma.topic.create({
    data: {
      chapterId: engCh1.id,
      name: 'Active & Passive Voice',
      nameGu: 'કર્તરિ અને કર્મણિ પ્રયોગ',
      description: 'Voice transformations and subject-object rules',
      descriptionGu: 'વાક્ય રૂપાંતરણ અને કર્તા-કર્મ નિયમો'
    }
  });

  console.log('📚 Subjects, Chapters, and Topics created with bilingual fields');

  // Helper to create bilingual question with options
  const createQ = async (
    topicId: string,
    questionText: string,
    questionTextGu: string,
    explanation: string,
    explanationGu: string,
    difficulty: 'EASY' | 'MEDIUM' | 'HARD',
    options: { text: string; textGu: string; correct: boolean }[]
  ) => {
    return await prisma.question.create({
      data: {
        topicId,
        questionText,
        questionTextGu,
        explanation,
        explanationGu,
        difficulty,
        options: {
          create: options.map(o => ({
            optionText: o.text,
            optionTextGu: o.textGu,
            isCorrect: o.correct
          }))
        }
      },
      include: { options: true }
    });
  };

  // Quadratic Questions
  const qQuad1 = await createQ(
    tQuad.id,
    'What are the roots of the quadratic equation x² - 5x + 6 = 0?',
    'દ્વિઘાત સમીકરણ x² - 5x + 6 = 0 ના બીજ કયા છે?',
    'Factorizing x² - 5x + 6 gives (x - 2)(x - 3) = 0, so roots are x = 2 and x = 3.',
    'x² - 5x + 6 નું અવયવીકરણ કરતાં (x - 2)(x - 3) = 0 મળે છે, તેથી બીજ x = 2 અને x = 3 છે.',
    'EASY',
    [
      { text: 'x = 2, x = 3', textGu: 'x = 2, x = 3', correct: true },
      { text: 'x = -2, x = -3', textGu: 'x = -2, x = -3', correct: false },
      { text: 'x = 1, x = 6', textGu: 'x = 1, x = 6', correct: false },
      { text: 'x = -1, x = 5', textGu: 'x = -1, x = 5', correct: false }
    ]
  );

  const qQuad2 = await createQ(
    tQuad.id,
    'What is the discriminant (D) of the equation 2x² - 4x + 3 = 0?',
    'સમીકરણ 2x² - 4x + 3 = 0 નો વિવેચક (D) શું છે?',
    'Formula D = b² - 4ac. Here a=2, b=-4, c=3. D = (-4)² - 4(2)(3) = 16 - 24 = -8.',
    'સૂત્ર D = b² - 4ac. અહીં a=2, b=-4, c=3. D = (-4)² - 4(2)(3) = 16 - 24 = -8.',
    'MEDIUM',
    [
      { text: '-8', textGu: '-8', correct: true },
      { text: '8', textGu: '8', correct: false },
      { text: '40', textGu: '40', correct: false },
      { text: '0', textGu: '0', correct: false }
    ]
  );

  const qQuad3 = await createQ(
    tQuad.id,
    'If a quadratic equation has a discriminant D < 0, what can be said about its roots?',
    'જો દ્વિઘાત સમીકરણનો વિવેચક D < 0 હોય, તો તેના બીજ વિશે શું કહી શકાય?',
    'When D < 0, the equation has no real roots (two complex conjugate roots).',
    'જ્યારે D < 0 હોય, ત્યારે સમીકરણને કોઈ વાસ્તવિક બીજ હોતા નથી (કાલ્પનિક/સંકર બીજ મળે છે).',
    'MEDIUM',
    [
      { text: 'Two equal real roots', textGu: 'બે સમાન વાસ્તવિક બીજ', correct: false },
      { text: 'Two distinct real roots', textGu: 'બે ભિન્ન વાસ્તવિક બીજ', correct: false },
      { text: 'No real roots (Complex roots)', textGu: 'કોઈ વાસ્તવિક બીજ નથી (સંકર બીજ)', correct: true },
      { text: 'One real root and one imaginary root', textGu: 'એક વાસ્તવિક અને એક કાલ્પનિક બીજ', correct: false }
    ]
  );

  // Trig Identity Questions
  const qTrig1 = await createQ(
    tTrigId.id,
    'Which of the following is equivalent to sin²(θ) + cos²(θ)?',
    'નીચેનામાંથી કયું sin²(θ) + cos²(θ) ની બરાબર છે?',
    'Pythagorean trigonometric identity states sin²(θ) + cos²(θ) = 1.',
    'પાયથાગોરિયન ત્રિકોણમિતીય નિત્યસમ મુજબ sin²(θ) + cos²(θ) = 1 થાય છે.',
    'EASY',
    [
      { text: '1', textGu: '1', correct: true },
      { text: '0', textGu: '0', correct: false },
      { text: 'tan(θ)', textGu: 'tan(θ)', correct: false },
      { text: 'sec(θ)', textGu: 'sec(θ)', correct: false }
    ]
  );

  const qTrig2 = await createQ(
    tTrigId.id,
    'Simplify: (1 - cos²(θ)) / sin(θ)',
    'સાદુરૂપ આપો: (1 - cos²(θ)) / sin(θ)',
    '1 - cos²(θ) = sin²(θ). Thus sin²(θ) / sin(θ) = sin(θ).',
    '1 - cos²(θ) = sin²(θ). આથી sin²(θ) / sin(θ) = sin(θ).',
    'MEDIUM',
    [
      { text: 'sin(θ)', textGu: 'sin(θ)', correct: true },
      { text: 'cos(θ)', textGu: 'cos(θ)', correct: false },
      { text: 'tan(θ)', textGu: 'tan(θ)', correct: false },
      { text: 'csc(θ)', textGu: 'csc(θ)', correct: false }
    ]
  );

  const qTrig3 = await createQ(
    tTrigId.id,
    'What is tan(45°) equal to?',
    'tan(45°) ની કિંમત કેટલી થાય?',
    'tan(45°) = sin(45°)/cos(45°) = (1/√2)/(1/√2) = 1.',
    'tan(45°) = sin(45°)/cos(45°) = (1/√2)/(1/√2) = 1.',
    'EASY',
    [
      { text: '1', textGu: '1', correct: true },
      { text: '0', textGu: '0', correct: false },
      { text: '1/√2', textGu: '1/√2', correct: false },
      { text: '√3', textGu: '√3', correct: false }
    ]
  );

  const qTrig4 = await createQ(
    tTrigId.id,
    'Express sec²(θ) - tan²(θ) in simplest terms.',
    'sec²(θ) - tan²(θ) નું અતિસંક્ષિપ્ત રૂપ દર્શાવો.',
    'By identity: 1 + tan²(θ) = sec²(θ), so sec²(θ) - tan²(θ) = 1.',
    'નિત્યસમ મુજબ: 1 + tan²(θ) = sec²(θ), તેથી sec²(θ) - tan²(θ) = 1.',
    'HARD',
    [
      { text: '1', textGu: '1', correct: true },
      { text: '2', textGu: '2', correct: false },
      { text: '-1', textGu: '-1', correct: false },
      { text: 'cot²(θ)', textGu: 'cot²(θ)', correct: false }
    ]
  );

  // Calculus Questions
  const qDiff1 = await createQ(
    tDiff.id,
    'What is the derivative of f(x) = 3x⁴ - 5x² + 7 with respect to x?',
    'x ના સાપેક્ષમાં f(x) = 3x⁴ - 5x² + 7 નું વિકલન શું છે?',
    'Using power rule d/dx(xⁿ) = n*xⁿ⁻¹: 3(4x³) - 5(2x) + 0 = 12x³ - 10x.',
    'ઘાતના નિયમ d/dx(xⁿ) = n*xⁿ⁻¹ મુજબ: 3(4x³) - 5(2x) + 0 = 12x³ - 10x.',
    'EASY',
    [
      { text: '12x³ - 10x', textGu: '12x³ - 10x', correct: true },
      { text: '7x³ - 10x + 7', textGu: '7x³ - 10x + 7', correct: false },
      { text: '12x² - 5', textGu: '12x² - 5', correct: false },
      { text: '3x³ - 5x', textGu: '3x³ - 5x', correct: false }
    ]
  );

  const qDiff2 = await createQ(
    tDiff.id,
    'What is the derivative of sin(x)?',
    'sin(x) નું વિકલિત શું થાય?',
    'The derivative of sin(x) with respect to x is cos(x).',
    'x ના સાપેક્ષમાં sin(x) નું વિકલન cos(x) થાય છે.',
    'EASY',
    [
      { text: 'cos(x)', textGu: 'cos(x)', correct: true },
      { text: '-cos(x)', textGu: '-cos(x)', correct: false },
      { text: 'tan(x)', textGu: 'tan(x)', correct: false },
      { text: '-sin(x)', textGu: '-sin(x)', correct: false }
    ]
  );

  // Newton Laws Questions
  const qNewt1 = await createQ(
    tNewton.id,
    'According to Newton Second Law of Motion, what is the formula connecting Force (F), Mass (m), and Acceleration (a)?',
    'ન્યૂટનના ગતિના બીજા નિયમ મુજબ બળ (F), દળ (m), અને પ્રવેગ (a) વચ્ચેનો સંબંધ દર્શાવતું સૂત્ર કયું છે?',
    'Newton Second Law states Force equals mass times acceleration: F = m * a.',
    'ન્યૂટનનો ગતિનો બીજો નિયમ દર્શાવે છે કે બળ એ દળ અને પ્રવેગના ગુણાકાર જેટલું હોય છે: F = m * a.',
    'EASY',
    [
      { text: 'F = m * a', textGu: 'F = m * a', correct: true },
      { text: 'F = m / a', textGu: 'F = m / a', correct: false },
      { text: 'F = a / m', textGu: 'F = a / m', correct: false },
      { text: 'F = m + a', textGu: 'F = m + a', correct: false }
    ]
  );

  const qNewt2 = await createQ(
    tNewton.id,
    'A body of mass 10 kg is acted upon by a net force of 50 N. What is its acceleration?',
    '10 kg દળ ધરાવતા પદાર્થ પર 50 N નું ચોખ્ખું બળ લાગે છે. તેનો પ્રવેગ કેટલો હશે?',
    'a = F / m = 50 N / 10 kg = 5 m/s².',
    'a = F / m = 50 N / 10 kg = 5 m/s².',
    'MEDIUM',
    [
      { text: '5 m/s²', textGu: '5 m/s²', correct: true },
      { text: '500 m/s²', textGu: '500 m/s²', correct: false },
      { text: '0.2 m/s²', textGu: '0.2 m/s²', correct: false },
      { text: '10 m/s²', textGu: '10 m/s²', correct: false }
    ]
  );

  // Chem Reaction Questions
  const qChem1 = await createQ(
    tChemReac.id,
    'In the chemical reaction 2H₂ + O₂ → 2H₂O, what are H₂ and O₂ called?',
    'રાસાયણિક પ્રક્રિયા 2H₂ + O₂ → 2H₂O માં H₂ અને O₂ ને શું કહેવાય છે?',
    'Substances on the left side of a chemical equation that undergo change are called Reactants.',
    'રાસાયણિક સમીકરણની ડાબી બાજુ રહેલા પદાર્થો જે પ્રક્રિયામાં ભાગ લે છે તેમને પ્રક્રિયકો કહેવાય છે.',
    'EASY',
    [
      { text: 'Reactants', textGu: 'પ્રક્રિયકો (Reactants)', correct: true },
      { text: 'Products', textGu: 'નીપજો (Products)', correct: false },
      { text: 'Catalysts', textGu: 'ઉદ્દીપકો (Catalysts)', correct: false },
      { text: 'Solvents', textGu: 'દ્રાવકો (Solvents)', correct: false }
    ]
  );

  const qChem2 = await createQ(
    tChemReac.id,
    'What type of reaction absorbs thermal energy from its surroundings?',
    'કયા પ્રકારની રાસાયણિક પ્રક્રિયા આસપાસમાંથી ઉષ્મા ઊર્જાનું શોષણ કરે છે?',
    'Endothermic reactions absorb energy in the form of heat from the surroundings.',
    'ઉષ્માશોષક પ્રક્રિયાઓ આસપાસમાંથી ઉષ્મા સ્વરૂપે ઊર્જાનું શોષણ કરે છે.',
    'MEDIUM',
    [
      { text: 'Endothermic reaction', textGu: 'ઉષ્માશોષક પ્રક્રિયા (Endothermic)', correct: true },
      { text: 'Exothermic reaction', textGu: 'ઉષ્માક્ષેપક પ્રક્રિયા (Exothermic)', correct: false },
      { text: 'Combustion reaction', textGu: 'દહન પ્રક્રિયા (Combustion)', correct: false },
      { text: 'Precipitation reaction', textGu: 'અવક્ષેપન પ્રક્રિયા (Precipitation)', correct: false }
    ]
  );

  // Tenses Questions
  const qEng1 = await createQ(
    tTenses.id,
    'Identify the correct sentence in Present Perfect Continuous tense:',
    'ચાલુ પૂર્ણ વર્તમાનકાળ (Present Perfect Continuous) નું સાચું વાક્ય ઓળખો:',
    'Formula: Subject + has/have been + verb-ing. "He has been studying for 3 hours."',
    'સૂત્ર: કર્તા + has/have been + ક્રિયાપદ-ing. "He has been studying for 3 hours."',
    'EASY',
    [
      { text: 'He has been studying for 3 hours.', textGu: 'He has been studying for 3 hours.', correct: true },
      { text: 'He is studying for 3 hours.', textGu: 'He is studying for 3 hours.', correct: false },
      { text: 'He studied for 3 hours.', textGu: 'He studied for 3 hours.', correct: false },
      { text: 'He will have studied for 3 hours.', textGu: 'He will have studied for 3 hours.', correct: false }
    ]
  );

  const qEng2 = await createQ(
    tTenses.id,
    'Select the sentence with the correct past perfect form:',
    'સાચા પૂર્ણ ભૂતકાળ (Past Perfect) વાળા વાક્યની પસંદગી કરો:',
    'Past perfect uses "had + past participle". "By the time the bell rang, she had finished her exam."',
    'પૂર્ણ ભૂતકાળમાં "had + ભૂતકૃદંત" વપરાય છે. "By the time the bell rang, she had finished her exam."',
    'MEDIUM',
    [
      { text: 'By the time the bell rang, she had finished her exam.', textGu: 'By the time the bell rang, she had finished her exam.', correct: true },
      { text: 'By the time the bell rang, she finished her exam.', textGu: 'By the time the bell rang, she finished her exam.', correct: false },
      { text: 'By the time the bell rang, she has finished her exam.', textGu: 'By the time the bell rang, she has finished her exam.', correct: false },
      { text: 'By the time the bell rang, she was finishing her exam.', textGu: 'By the time the bell rang, she was finishing her exam.', correct: false }
    ]
  );

  console.log('❓ Question bank seeded with complete Gujarati translations');

  // Create Tests with Gujarati titles and descriptions
  const mathTest1 = await prisma.test.create({
    data: {
      title: 'Mathematics Algebra & Trigonometry Benchmark',
      titleGu: 'ગણિત બીજગણિત અને ત્રિકોણમિતિ બેંચમાર્ક',
      description: 'Comprehensive test covering Quadratic Equations and Trigonometric Identities.',
      descriptionGu: 'દ્વિઘાત સમીકરણો અને ત્રિકોણમિતીય નિત્યસમોને આવરી લેતો સર્વગ્રાહી ટેસ્ટ.',
      subjectId: math.id,
      difficulty: 'MEDIUM',
      durationMinutes: 15,
      passPercentage: 60.0,
      testQuestions: {
        create: [
          { questionId: qQuad1.id, order: 1 },
          { questionId: qQuad2.id, order: 2 },
          { questionId: qQuad3.id, order: 3 },
          { questionId: qTrig1.id, order: 4 },
          { questionId: qTrig2.id, order: 5 },
          { questionId: qTrig3.id, order: 6 },
          { questionId: qTrig4.id, order: 7 }
        ]
      }
    }
  });

  const mathTrigRemedialTest = await prisma.test.create({
    data: {
      title: 'Trigonometry Basic Practice & Foundations',
      titleGu: 'ત્રિકોણમિતિ પાયાની પ્રેક્ટિસ અને મૂળભૂત ખ્યાલો',
      description: 'Targeted practice test focusing on fundamental trigonometric identities and angle values.',
      descriptionGu: 'મૂળભૂત ત્રિકોણમિતીય નિત્યસમો અને ખૂણાના મૂલ્યો પર ધ્યાન કેન્દ્રિત કરતી લક્ષિત પ્રેક્ટિસ ટેસ્ટ.',
      subjectId: math.id,
      difficulty: 'BASIC',
      durationMinutes: 10,
      passPercentage: 50.0,
      testQuestions: {
        create: [
          { questionId: qTrig1.id, order: 1 },
          { questionId: qTrig3.id, order: 2 },
          { questionId: qTrig2.id, order: 3 }
        ]
      }
    }
  });

  const sciTest1 = await prisma.test.create({
    data: {
      title: 'General Science Midterm Assessment',
      titleGu: 'સામાન્ય વિજ્ઞાન મધ્યસત્ર મૂલ્યાંકન',
      description: 'Evaluation test covering Newton Laws of Motion and Chemical Reactions.',
      descriptionGu: 'ન્યૂટનના ગતિના નિયમો અને રાસાયણિક પ્રક્રિયાઓને આવરી લેતી મૂલ્યાંકન કસોટી.',
      subjectId: science.id,
      difficulty: 'MEDIUM',
      durationMinutes: 15,
      passPercentage: 60.0,
      testQuestions: {
        create: [
          { questionId: qNewt1.id, order: 1 },
          { questionId: qNewt2.id, order: 2 },
          { questionId: qChem1.id, order: 3 },
          { questionId: qChem2.id, order: 4 }
        ]
      }
    }
  });

  const engTest1 = await prisma.test.create({
    data: {
      title: 'English Grammar & Tenses Mastery',
      titleGu: 'અંગ્રેજી વ્યાકરણ અને કાળ નિપુણતા',
      description: 'Test your grasp on English verb tenses, present perfect and past perfect transformations.',
      descriptionGu: 'અંગ્રેજી ક્રિયાપદ કાળ, પૂર્ણ વર્તમાન અને પૂર્ણ ભૂતકાળના રૂપાંતરણ પર તમારી પકડ ચકાસો.',
      subjectId: english.id,
      difficulty: 'EASY',
      durationMinutes: 10,
      passPercentage: 70.0,
      testQuestions: {
        create: [
          { questionId: qEng1.id, order: 1 },
          { questionId: qEng2.id, order: 2 }
        ]
      }
    }
  });

  console.log('📝 Tests created with bilingual fields');

  if (shouldSeedUsers && studentUser) {
    // Seed Previous Test Attempts for Student (Zain Patel)
    const attempt1 = await prisma.testAttempt.create({
    data: {
      userId: studentUser.id,
      testId: mathTest1.id,
      score: 3.0,
      maxScore: 7.0,
      percentage: 42.8,
      accuracy: 42.8,
      timeTakenSeconds: 520,
      correctCount: 3,
      wrongCount: 4,
      unansweredCount: 0,
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
  });

  const ansQuad1 = qQuad1.options.find(o => o.isCorrect)!;
  const ansQuad2Wrong = qQuad2.options.find(o => !o.isCorrect)!;
  const ansQuad3Wrong = qQuad3.options.find(o => !o.isCorrect)!;
  const ansTrig1 = qTrig1.options.find(o => o.isCorrect)!;
  const ansTrig2Wrong = qTrig2.options.find(o => !o.isCorrect)!;
  const ansTrig3 = qTrig3.options.find(o => o.isCorrect)!;
  const ansTrig4Wrong = qTrig4.options.find(o => !o.isCorrect)!;

  const sa1 = await prisma.studentAnswer.create({
    data: { attemptId: attempt1.id, questionId: qQuad1.id, selectedOptionId: ansQuad1.id, isCorrect: true, timeTakenSeconds: 45 }
  });
  const sa2 = await prisma.studentAnswer.create({
    data: { attemptId: attempt1.id, questionId: qQuad2.id, selectedOptionId: ansQuad2Wrong.id, isCorrect: false, timeTakenSeconds: 90 }
  });
  const sa3 = await prisma.studentAnswer.create({
    data: { attemptId: attempt1.id, questionId: qQuad3.id, selectedOptionId: ansQuad3Wrong.id, isCorrect: false, timeTakenSeconds: 80 }
  });
  const sa4 = await prisma.studentAnswer.create({
    data: { attemptId: attempt1.id, questionId: qTrig1.id, selectedOptionId: ansTrig1.id, isCorrect: true, timeTakenSeconds: 30 }
  });
  const sa5 = await prisma.studentAnswer.create({
    data: { attemptId: attempt1.id, questionId: qTrig2.id, selectedOptionId: ansTrig2Wrong.id, isCorrect: false, timeTakenSeconds: 110 }
  });
  const sa6 = await prisma.studentAnswer.create({
    data: { attemptId: attempt1.id, questionId: qTrig3.id, selectedOptionId: ansTrig3.id, isCorrect: true, timeTakenSeconds: 35 }
  });
  const sa7 = await prisma.studentAnswer.create({
    data: { attemptId: attempt1.id, questionId: qTrig4.id, selectedOptionId: ansTrig4Wrong.id, isCorrect: false, timeTakenSeconds: 130 }
  });

  // Populate Mistake Book for Attempt 1 incorrect answers
  await prisma.mistakeBookEntry.create({
    data: {
      userId: studentUser.id,
      questionId: qQuad2.id,
      studentAnswerId: sa2.id,
      topicId: tQuad.id,
      incorrectCount: 1,
      isResolved: false
    }
  });

  await prisma.mistakeBookEntry.create({
    data: {
      userId: studentUser.id,
      questionId: qTrig2.id,
      studentAnswerId: sa5.id,
      topicId: tTrigId.id,
      incorrectCount: 2,
      isResolved: false
    }
  });

  await prisma.mistakeBookEntry.create({
    data: {
      userId: studentUser.id,
      questionId: qTrig4.id,
      studentAnswerId: sa7.id,
      topicId: tTrigId.id,
      incorrectCount: 2,
      isResolved: false
    }
  });

  // Attempt 2: Science Midterm
  await prisma.testAttempt.create({
    data: {
      userId: studentUser.id,
      testId: sciTest1.id,
      score: 3.0,
      maxScore: 4.0,
      percentage: 75.0,
      accuracy: 75.0,
      timeTakenSeconds: 400,
      correctCount: 3,
      wrongCount: 1,
      unansweredCount: 0,
      completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    }
  });

  // Attempt 3: English Test
  await prisma.testAttempt.create({
    data: {
      userId: studentUser.id,
      testId: engTest1.id,
      score: 2.0,
      maxScore: 2.0,
      percentage: 100.0,
      accuracy: 100.0,
      timeTakenSeconds: 180,
      correctCount: 2,
      wrongCount: 0,
      unansweredCount: 0,
      completedAt: new Date()
    }
  });

  // Seed Topic Performances for Student
  await prisma.topicPerformance.createMany({
    data: [
      {
        userId: studentUser.id,
        topicId: tTrigId.id,
        accuracy: 42.8,
        attemptCount: 4,
        repeatedMistakes: 5,
        totalQuestionsAttempted: 7,
        totalCorrect: 3,
        status: 'CRITICAL',
        lastEvaluatedAt: new Date()
      },
      {
        userId: studentUser.id,
        topicId: tQuad.id,
        accuracy: 50.0,
        attemptCount: 3,
        repeatedMistakes: 2,
        totalQuestionsAttempted: 6,
        totalCorrect: 3,
        status: 'NEEDS_IMPROVEMENT',
        lastEvaluatedAt: new Date()
      },
      {
        userId: studentUser.id,
        topicId: tNewton.id,
        accuracy: 100.0,
        attemptCount: 2,
        repeatedMistakes: 0,
        totalQuestionsAttempted: 4,
        totalCorrect: 4,
        status: 'EXCELLENT',
        lastEvaluatedAt: new Date()
      },
      {
        userId: studentUser.id,
        topicId: tChemReac.id,
        accuracy: 66.7,
        attemptCount: 2,
        repeatedMistakes: 1,
        totalQuestionsAttempted: 3,
        totalCorrect: 2,
        status: 'AVERAGE',
        lastEvaluatedAt: new Date()
      },
      {
        userId: studentUser.id,
        topicId: tTenses.id,
        accuracy: 100.0,
        attemptCount: 2,
        repeatedMistakes: 0,
        totalQuestionsAttempted: 2,
        totalCorrect: 2,
        status: 'EXCELLENT',
        lastEvaluatedAt: new Date()
      }
    ]
  });

  // Initial Study Plan
  await prisma.studyPlan.create({
    data: {
      userId: studentUser.id,
      availableMinutes: 180,
      targetPercentage: 85.0,
      examDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      tasks: {
        create: [
          {
            topicId: tTrigId.id,
            subjectName: 'Mathematics',
            topicName: 'Trigonometric Identities',
            durationMinutes: 45,
            priority: 'HIGH',
            activityType: 'CONCEPT_REVIEW',
            dayNumber: 1,
            isCompleted: false,
            taskDate: new Date()
          },
          {
            topicId: tQuad.id,
            subjectName: 'Mathematics',
            topicName: 'Quadratic Equations',
            durationMinutes: 40,
            priority: 'HIGH',
            activityType: 'MCQ_PRACTICE',
            dayNumber: 1,
            isCompleted: false,
            taskDate: new Date()
          },
          {
            topicId: tChemReac.id,
            subjectName: 'Science',
            topicName: 'Chemical Reactions',
            durationMinutes: 35,
            priority: 'MEDIUM',
            activityType: 'MISTAKE_REVISION',
            dayNumber: 1,
            isCompleted: true,
            taskDate: new Date()
          },
          {
            topicId: tTenses.id,
            subjectName: 'English Language',
            topicName: 'Tenses & Verbs',
            durationMinutes: 30,
            priority: 'LOW',
            activityType: 'MOCK_QUIZ',
            dayNumber: 1,
            isCompleted: true,
            taskDate: new Date()
          }
        ]
      }
    }
  });

  // Notifications with complete Gujarati translations
  await prisma.notification.createMany({
    data: [
      {
        userId: studentUser.id,
        title: 'Recommended Remedial Test Available',
        titleGu: 'ભલામણ કરેલ સુધારાત્મક ટેસ્ટ ઉપલબ્ધ છે',
        message: 'Your accuracy in Trigonometric Identities is 42.8%. We recommend taking "Trigonometry Basic Practice & Foundations".',
        messageGu: 'ત્રિકોણમિતીય નિત્યસમોમાં તમારી ચોકસાઈ 42.8% છે. અમે "ત્રિકોણમિતિ પાયાની પ્રેક્ટિસ અને મૂળભૂત ખ્યાલો" ટેસ્ટ આપવાની ભલામણ કરીએ છીએ.',
        type: 'TEST'
      },
      {
        userId: studentUser.id,
        title: 'Repeated Mistake Warning ⚠️',
        titleGu: 'વારંવાર થતી ભૂલની ચેતવણી ⚠️',
        message: 'You have made 2 repeated errors in Trigonometric Identities. Review formulas in your Mistake Book.',
        messageGu: 'તમે ત્રિકોણમિતીય નિત્યસમોમાં 2 વારંવાર ભૂલો કરી છે. તમારી ભૂલ પુસ્તકમાં સૂત્રોનું પુનરાવર્તન કરો.',
        type: 'MISTAKE'
      },
      {
        userId: studentUser.id,
        title: 'Streak Milestone! 🔥',
        titleGu: 'અભ્યાસ સાતત્ય સિદ્ધિ! 🔥',
        message: 'You are on a 5-day active study streak! Keep up the momentum!',
        messageGu: 'તમે 5-દિવસની સક્રિય અભ્યાસ સ્ટ્રીક પર છો! આ વેગ જાળવી રાખો!',
        type: 'STREAK'
      }
    ]
  });

  // Achievements with Gujarati translations
  await prisma.achievement.createMany({
    data: [
      {
        userId: studentUser.id,
        badgeName: 'First Test Completed',
        badgeNameGu: 'પ્રથમ ટેસ્ટ પૂર્ણ',
        badgeIcon: 'check-circle-2',
        description: 'Successfully submitted your first online test assessment.',
        descriptionGu: 'તમારું પ્રથમ ઓનલાઇન ટેસ્ટ મૂલ્યાંકન સફળતાપૂર્વક સબમિટ કર્યું.'
      },
      {
        userId: studentUser.id,
        badgeName: '5-Day Study Streak',
        badgeNameGu: '5-દિવસ અભ્યાસ સ્ટ્રીક',
        badgeIcon: 'flame',
        description: 'Maintained active daily learning for 5 consecutive days.',
        descriptionGu: 'સતત 5 દિવસ સુધી દૈનિક સક્રિય અભ્યાસ જાળવી રાખ્યો.'
      },
      {
        userId: studentUser.id,
        badgeName: 'Grammar Master',
        badgeNameGu: 'વ્યાકરણ માસ્ટર',
        badgeIcon: 'award',
        description: 'Achieved 100% accuracy on English Grammar Tenses test.',
        descriptionGu: 'અંગ્રેજી વ્યાકરણ કાળ ટેસ્ટમાં 100% ચોકસાઈ મેળવી.'
      }
    ]
  });
  }

  console.log('✅ Database seeding finished successfully with bilingual support!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
