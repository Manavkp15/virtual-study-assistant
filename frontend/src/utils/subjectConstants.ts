export interface TeacherSubjectOption {
  name: string;
  nameGu: string;
  nameHi: string;
  code: string;
}

// Exactly the 7 allowed subjects across the entire application
export const TEACHER_SUBJECTS: TeacherSubjectOption[] = [
  { name: 'Mathematics', nameGu: 'ગણિત', nameHi: 'गणित', code: 'MATH101' },
  { name: 'Science', nameGu: 'વિજ્ઞાન', nameHi: 'विज्ञान', code: 'SCI101' },
  { name: 'Social Science', nameGu: 'સામાજિક વિજ્ઞાન', nameHi: 'सामाजिक विज्ञान', code: 'SS101' },
  { name: 'Gujarati', nameGu: 'ગુજરાતી', nameHi: 'गुजराती', code: 'GUJ101' },
  { name: 'Hindi', nameGu: 'હિન્દી', nameHi: 'हिन्दी', code: 'HIN101' },
  { name: 'English', nameGu: 'અંગ્રેજી', nameHi: 'अंग्रेजी', code: 'ENG101' },
  { name: 'Sanskrit', nameGu: 'સંસ્કૃત', nameHi: 'संस्कृत', code: 'SKT101' }
];

/**
 * Returns the localized name of a subject based on active language.
 */
export const getLocalizedSubjectName = (subjectName?: string | null, lang: string = 'en'): string => {
  if (!subjectName) return '';
  const trimmed = subjectName.trim().toLowerCase();
  const match = TEACHER_SUBJECTS.find(
    s => s.name.toLowerCase() === trimmed || s.nameGu.toLowerCase() === trimmed || s.nameHi.toLowerCase() === trimmed
  );

  if (!match) return subjectName;
  if (lang === 'gu') return match.nameGu;
  if (lang === 'hi') return match.nameHi;
  return match.name;
};

/**
 * Returns plain localized label without English suffix.
 */
export const getPureLocalizedSubject = (subjectName?: string | null, lang: string = 'en'): string => {
  if (!subjectName) return '';
  const trimmed = subjectName.trim().toLowerCase();
  const match = TEACHER_SUBJECTS.find(
    s => s.name.toLowerCase() === trimmed || s.nameGu.toLowerCase() === trimmed || s.nameHi.toLowerCase() === trimmed
  );

  if (!match) return subjectName;
  if (lang === 'gu') return match.nameGu;
  if (lang === 'hi') return match.nameHi;
  return match.name;
};

/**
 * Check if the given subject name matches one of the 7 canonical subjects.
 */
export const isValidTeacherSubject = (subjectName: string): boolean => {
  if (!subjectName || typeof subjectName !== 'string') return false;
  const trimmed = subjectName.trim().toLowerCase();
  return TEACHER_SUBJECTS.some(
    s => s.name.toLowerCase() === trimmed || s.nameGu.toLowerCase() === trimmed || s.nameHi.toLowerCase() === trimmed
  );
};

/**
 * Get canonical English name for a subject.
 */
export const getCanonicalSubjectName = (subjectName: string): string => {
  if (!subjectName || typeof subjectName !== 'string') return '';
  const trimmed = subjectName.trim().toLowerCase();
  const match = TEACHER_SUBJECTS.find(
    s => s.name.toLowerCase() === trimmed || s.nameGu.toLowerCase() === trimmed || s.nameHi.toLowerCase() === trimmed
  );
  return match ? match.name : subjectName.trim();
};

/**
 * Extract an array of canonical subject names assigned to a teacher.
 */
export const getUserAssignedSubjects = (user?: any | null): string[] => {
  if (!user) return [];

  if (Array.isArray(user.subjects) && user.subjects.length > 0) {
    return Array.from(new Set(user.subjects.map(String).map((s: string) => getCanonicalSubjectName(s)).filter(Boolean)));
  }

  if (Array.isArray(user.teacherSubjects) && user.teacherSubjects.length > 0) {
    const fromTs = user.teacherSubjects.map((ts: any) => ts?.subject?.name || ts?.name || String(ts)).filter(Boolean);
    if (fromTs.length > 0) {
      return Array.from(new Set(fromTs.map((s: string) => getCanonicalSubjectName(s)).filter(Boolean)));
    }
  }

  if (Array.isArray(user.subjectMappings) && user.subjectMappings.length > 0) {
    const fromSm = user.subjectMappings.map((sm: any) => sm?.subject?.name || sm?.name || String(sm)).filter(Boolean);
    if (fromSm.length > 0) {
      return Array.from(new Set(fromSm.map((s: string) => getCanonicalSubjectName(s)).filter(Boolean)));
    }
  }

  const raw = user.teachingSubjects || user.teacherSubject || user.subject || '';
  if (typeof raw === 'string' && raw.trim()) {
    const parts = raw.split(',').map((s: string) => s.trim()).filter(Boolean);
    return Array.from(new Set(parts.map((s: string) => getCanonicalSubjectName(s)).filter(Boolean)));
  }

  return [];
};

/**
 * Format teacher's assigned subjects for UI display according to language.
 */
export const formatUserSubjectsDisplay = (
  subjects: string[],
  lang: string = 'en',
  separator: string = ' | '
): string => {
  if (!subjects || subjects.length === 0) return '';
  return subjects
    .map(s => getLocalizedSubjectName(s, lang))
    .join(separator);
};
