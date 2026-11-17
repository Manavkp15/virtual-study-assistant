const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CANONICAL_SUBJECTS = [
  { name: 'Mathematics', nameGu: 'ગણિત', code: 'MATH101' },
  { name: 'Science', nameGu: 'વિજ્ઞાન', code: 'SCI101' },
  { name: 'Social Science', nameGu: 'સામાજિક વિજ્ઞાન', code: 'SS101' },
  { name: 'Gujarati', nameGu: 'ગુજરાતી', code: 'GUJ101' },
  { name: 'Hindi', nameGu: 'હિન્દી', code: 'HIN101' },
  { name: 'English', nameGu: 'અંગ્રેજી', code: 'ENG101' },
  { name: 'Sanskrit', nameGu: 'સંસ્કૃત', code: 'SKT101' }
];

async function migrate() {
  console.log('--- SEEDING 7 CANONICAL SUBJECTS ---');
  for (const s of CANONICAL_SUBJECTS) {
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
          icon: 'book',
          description: `${s.name} Curriculum`,
          descriptionGu: `${s.nameGu} અભ્યાસક્રમ`,
          status: 'ACTIVE'
        }
      });
      console.log(`Created subject: ${s.name} (${s.nameGu})`);
    } else {
      await prisma.subject.update({
        where: { id: existing.id },
        data: {
          name: s.name,
          nameGu: s.nameGu,
          status: 'ACTIVE'
        }
      });
      console.log(`Updated subject: ${s.name} (${s.nameGu})`);
    }
  }

  // Get Science subject for mapping legacy Physics/Chemistry
  const scienceSub = await prisma.subject.findFirst({ where: { name: 'Science' } });

  // Migrate legacy homework/study materials that pointed to non-canonical subjects
  if (scienceSub) {
    const legacySubs = await prisma.subject.findMany({
      where: {
        name: { in: ['Physics', 'Chemistry', 'Biology', 'Computer Science'] }
      }
    });

    for (const leg of legacySubs) {
      await prisma.homework.updateMany({
        where: { subjectId: leg.id },
        data: { subjectId: scienceSub.id }
      });
      await prisma.studyMaterial.updateMany({
        where: { subjectId: leg.id },
        data: { subjectId: scienceSub.id }
      });
      await prisma.videoLecture.updateMany({
        where: { subjectId: leg.id },
        data: { subjectId: scienceSub.id }
      });
      // Delete legacy mappings
      await prisma.teacherSubjectMapping.deleteMany({
        where: { subjectId: leg.id }
      });
      // Delete legacy subject
      await prisma.subject.delete({
        where: { id: leg.id }
      }).catch(err => console.log('Legacy delete notice:', err.message));
    }
  }

  console.log('--- MIGRATING EXISTING TEACHERS TO TeacherSubject TABLE ---');
  const teachers = await prisma.user.findMany({
    where: { role: 'TEACHER' },
    include: {
      subjectMappings: { include: { subject: true } }
    }
  });

  const allSubjects = await prisma.subject.findMany();
  const subjectMap = new Map(allSubjects.map(s => [s.name.toLowerCase(), s.id]));

  for (const t of teachers) {
    const subjectIdsToAssign = new Set();

    // 1. From existing subjectMappings
    if (t.subjectMappings && t.subjectMappings.length > 0) {
      for (const m of t.subjectMappings) {
        if (m.subject && subjectMap.has(m.subject.name.toLowerCase())) {
          subjectIdsToAssign.add(m.subject.id);
        } else if (scienceSub) {
          subjectIdsToAssign.add(scienceSub.id);
        }
      }
    }

    // 2. From teacherSubject field
    if (t.teacherSubject) {
      const matchId = subjectMap.get(t.teacherSubject.toLowerCase());
      if (matchId) subjectIdsToAssign.add(matchId);
      else if (scienceSub) subjectIdsToAssign.add(scienceSub.id);
    }

    // 3. From teachingSubjects field
    if (t.teachingSubjects) {
      const parts = t.teachingSubjects.split(',').map(s => s.trim().toLowerCase());
      for (const part of parts) {
        const matchId = subjectMap.get(part);
        if (matchId) subjectIdsToAssign.add(matchId);
      }
    }

    // If teacher still has no subjects, assign Mathematics by default so they have at least 1
    if (subjectIdsToAssign.size === 0) {
      const mathId = subjectMap.get('mathematics');
      if (mathId) subjectIdsToAssign.add(mathId);
    }

    // Save into TeacherSubject table
    for (const subId of subjectIdsToAssign) {
      await prisma.teacherSubject.upsert({
        where: {
          teacherId_subjectId: {
            teacherId: t.id,
            subjectId: subId
          }
        },
        update: {},
        create: {
          teacherId: t.id,
          subjectId: subId
        }
      });
      // Also keep teacherSubjectMapping in sync
      await prisma.teacherSubjectMapping.upsert({
        where: {
          teacherId_subjectId: {
            teacherId: t.id,
            subjectId: subId
          }
        },
        update: {},
        create: {
          teacherId: t.id,
          subjectId: subId
        }
      });
    }
    console.log(`Teacher ${t.name} (${t.email}): assigned ${subjectIdsToAssign.size} subjects.`);
  }

  console.log('Migration completed successfully!');
}

migrate()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
