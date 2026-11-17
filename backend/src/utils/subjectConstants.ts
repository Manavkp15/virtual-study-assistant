import { PrismaClient } from '@prisma/client';

export interface SubjectOption {
  name: string;
  nameGu: string;
  code: string;
  icon?: string;
  description?: string;
  descriptionGu?: string;
}

// Exactly the 7 allowed subjects across the entire application
export const TEACHER_SUBJECTS: SubjectOption[] = [
  {
    name: 'Mathematics',
    nameGu: 'ગણિત',
    code: 'MATH101',
    icon: 'calculator',
    description: 'Algebra, Arithmetic, Geometry & Statistics',
    descriptionGu: 'બીજગણિત, અંકગણિત, ભૂમિતિ અને આંકડાશાસ્ત્ર'
  },
  {
    name: 'Science',
    nameGu: 'વિજ્ઞાન',
    code: 'SCI101',
    icon: 'flask-conical',
    description: 'Natural Sciences, Physics, Chemistry & Biology',
    descriptionGu: 'કુદરતી વિજ્ઞાન, ભૌતિક વિજ્ઞાન, રસાયણ વિજ્ઞાન અને જીવવિજ્ઞાન'
  },
  {
    name: 'Social Science',
    nameGu: 'સામાજિક વિજ્ઞાન',
    code: 'SS101',
    icon: 'globe',
    description: 'History, Civics & Geography',
    descriptionGu: 'ઇતિહાસ, નાગરિકશાસ્ત્ર અને ભૂગોળ'
  },
  {
    name: 'Gujarati',
    nameGu: 'ગુજરાતી',
    code: 'GUJ101',
    icon: 'book-open',
    description: 'Gujarati Language & Literature',
    descriptionGu: 'ગુજરાતી ભાષા અને સાહિત્ય'
  },
  {
    name: 'Hindi',
    nameGu: 'હિન્દી',
    code: 'HIN101',
    icon: 'languages',
    description: 'Hindi Language & Grammar',
    descriptionGu: 'હિન્દી ભાષા અને વ્યાકરણ'
  },
  {
    name: 'English',
    nameGu: 'અંગ્રેજી',
    code: 'ENG101',
    icon: 'book-marked',
    description: 'English Grammar, Comprehension & Writing',
    descriptionGu: 'અંગ્રેજી વ્યાકરણ અને સાહિત્ય'
  },
  {
    name: 'Sanskrit',
    nameGu: 'સંસ્કૃત',
    code: 'SKT101',
    icon: 'scroll',
    description: 'Sanskrit Language, Shlokas & Grammar',
    descriptionGu: 'સંસ્કૃત ભાષા, શ્લોકો અને વ્યાકરણ'
  }
];

/**
 * Check if the given subject name matches one of the 7 canonical subjects (case-insensitive).
 */
export const isValidTeacherSubject = (subjectName: string): boolean => {
  if (!subjectName || typeof subjectName !== 'string') return false;
  const trimmed = subjectName.trim().toLowerCase();
  return TEACHER_SUBJECTS.some(
    s => s.name.toLowerCase() === trimmed || s.nameGu.toLowerCase() === trimmed
  );
};

/**
 * Get canonical English name for a subject option.
 */
export const getCanonicalSubjectName = (subjectName: string): string => {
  if (!subjectName || typeof subjectName !== 'string') return '';
  const trimmed = subjectName.trim().toLowerCase();
  const match = TEACHER_SUBJECTS.find(
    s => s.name.toLowerCase() === trimmed || s.nameGu.toLowerCase() === trimmed
  );
  return match ? match.name : subjectName.trim();
};

/**
 * Ensure all 7 canonical subjects exist in the Subject table.
 */
export const seedCanonicalSubjects = async (prisma: PrismaClient) => {
  for (const s of TEACHER_SUBJECTS) {
    const existing = await prisma.subject.findFirst({
      where: {
        OR: [
          { name: { equals: s.name } },
          { code: { equals: s.code } }
        ]
      }
    });

    if (!existing) {
      await prisma.subject.create({
        data: {
          name: s.name,
          nameGu: s.nameGu,
          code: s.code,
          standard: 'Standard 8',
          icon: s.icon || 'book',
          description: s.description || `${s.name} Curriculum`,
          descriptionGu: s.descriptionGu || `${s.nameGu} અભ્યાસક્રમ`,
          status: 'ACTIVE',
          chapters: {
            create: {
              name: `${s.name} Fundamentals`,
              nameGu: `${s.nameGu} મૂળભૂત બાબતો`,
              order: 1,
              topics: {
                create: {
                  name: `Introduction to ${s.name}`,
                  nameGu: `${s.nameGu} પરિચય`,
                  description: `Fundamental topics for ${s.name}`,
                  descriptionGu: `${s.nameGu} માટેના મુખ્ય મુદ્દાઓ`
                }
              }
            }
          }
        }
      });
    } else {
      // Ensure nameGu and status are set
      await prisma.subject.update({
        where: { id: existing.id },
        data: {
          name: s.name,
          nameGu: s.nameGu,
          status: 'ACTIVE'
        }
      });
    }
  }
};

/**
 * Ensure the given subject exists in the Prisma Subject table.
 */
export const ensureSubjectInDatabase = async (prisma: PrismaClient, subjectName: string) => {
  const canonicalName = getCanonicalSubjectName(subjectName);
  const metadata = TEACHER_SUBJECTS.find(s => s.name.toLowerCase() === canonicalName.toLowerCase());

  let subject = await prisma.subject.findFirst({
    where: {
      OR: [
        { name: { equals: canonicalName } },
        { name: { equals: subjectName } }
      ]
    }
  });

  if (!subject) {
    const code = metadata?.code || `${canonicalName.slice(0, 3).toUpperCase()}101`;
    const nameGu = metadata?.nameGu || canonicalName;

    const existingCode = await prisma.subject.findUnique({ where: { code } });
    const finalCode = existingCode ? `${code}_${Date.now().toString().slice(-4)}` : code;

    subject = await prisma.subject.create({
      data: {
        name: canonicalName,
        nameGu,
        code: finalCode,
        standard: 'Standard 8',
        icon: metadata?.icon || 'book',
        description: metadata?.description || `${canonicalName} Curriculum`,
        descriptionGu: metadata?.descriptionGu || `${nameGu} અભ્યાસક્રમ`,
        status: 'ACTIVE',
        chapters: {
          create: {
            name: `${canonicalName} Fundamentals`,
            nameGu: `${nameGu} મૂળભૂત બાબતો`,
            order: 1,
            topics: {
              create: {
                name: `Core ${canonicalName} Concepts`,
                nameGu: `મુખ્ય ${nameGu} ખ્યાલો`,
                description: `General topics for ${canonicalName}`,
                descriptionGu: `${nameGu} માટે સામાન્ય મુદ્દાઓ`
              }
            }
          }
        }
      }
    });
  }

  return subject;
};

/**
 * Retrieve all canonical subjects assigned to a teacher.
 * Checks TeacherSubject table first, then fallback to TeacherSubjectMapping, then fallback to user teachingSubjects/teacherSubject fields.
 */
export const getTeacherAssignedSubjects = async (prisma: PrismaClient, teacherId: string) => {
  // 1. Check TeacherSubject table
  const teacherSubjects = await prisma.teacherSubject.findMany({
    where: { teacherId },
    include: { subject: true }
  });
  if (teacherSubjects.length > 0) {
    return teacherSubjects.map(ts => ts.subject);
  }

  // 2. Check TeacherSubjectMapping table
  const mappings = await prisma.teacherSubjectMapping.findMany({
    where: { teacherId },
    include: { subject: true }
  });
  if (mappings.length > 0) {
    return mappings.map(m => m.subject);
  }

  // 3. Fallback to user columns
  const user = await prisma.user.findUnique({
    where: { id: teacherId },
    select: { teacherSubject: true, teachingSubjects: true }
  });
  if (!user) return [];

  const rawList = user.teachingSubjects || user.teacherSubject || '';
  const names = rawList.split(',').map(s => s.trim()).filter(Boolean);
  if (names.length === 0) return [];

  const subjects = await prisma.subject.findMany({
    where: {
      OR: [
        { name: { in: names } },
        { nameGu: { in: names } }
      ]
    }
  });
  return subjects;
};

/**
 * Check if a teacher is authorized to access / create content for a specific subject ID.
 */
export const isTeacherAuthorizedForSubject = async (
  prisma: PrismaClient,
  teacherId: string,
  subjectId: string
): Promise<boolean> => {
  const assigned = await getTeacherAssignedSubjects(prisma, teacherId);
  return assigned.some(s => s.id === subjectId);
};
