const { PrismaClient } = require('@prisma/client');

let databaseUrl = process.env.DATABASE_URL;
if (databaseUrl && databaseUrl.startsWith('postgres://')) {
  databaseUrl = databaseUrl.replace('postgres://', 'postgresql://');
  process.env.DATABASE_URL = databaseUrl;
}

const prisma = new PrismaClient({
  datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined
});

async function clearAllProfilesAndCredentials() {
  console.log('🧹 Starting cleanup: clearing all emails, passwords, and profiles across all standards...');

  try {
    // 1. Delete student activity & submission records
    const delTeacherSubjects = await prisma.teacherSubjectMapping.deleteMany();
    console.log(`- Deleted ${delTeacherSubjects.count} teacher subject mappings`);

    const delRemAnswers = await prisma.remedialSessionAnswer.deleteMany();
    console.log(`- Deleted ${delRemAnswers.count} remedial session answers`);

    const delRemSessions = await prisma.remedialSession.deleteMany();
    console.log(`- Deleted ${delRemSessions.count} remedial sessions`);

    const delAiChecks = await prisma.aiHomeworkCheck.deleteMany();
    console.log(`- Deleted ${delAiChecks.count} AI homework checks`);

    const delSubHist = await prisma.homeworkSubmissionHistory.deleteMany();
    console.log(`- Deleted ${delSubHist.count} homework submission history records`);

    const delSub = await prisma.homeworkSubmission.deleteMany();
    console.log(`- Deleted ${delSub.count} homework submissions`);

    const delAccess = await prisma.studyMaterialAccess.deleteMany();
    console.log(`- Deleted ${delAccess.count} study material accesses`);

    const delAnswers = await prisma.studentAnswer.deleteMany();
    console.log(`- Deleted ${delAnswers.count} student answers`);

    const delAttempts = await prisma.testAttempt.deleteMany();
    console.log(`- Deleted ${delAttempts.count} test attempts`);

    const delMistakes = await prisma.mistakeBookEntry.deleteMany();
    console.log(`- Deleted ${delMistakes.count} mistake book entries`);

    const delPerf = await prisma.topicPerformance.deleteMany();
    console.log(`- Deleted ${delPerf.count} topic performances`);

    const delTasks = await prisma.studyTask.deleteMany();
    console.log(`- Deleted ${delTasks.count} study tasks`);

    const delPlans = await prisma.studyPlan.deleteMany();
    console.log(`- Deleted ${delPlans.count} study plans`);

    const delNotifs = await prisma.notification.deleteMany();
    console.log(`- Deleted ${delNotifs.count} notifications`);

    const delAchieve = await prisma.achievement.deleteMany();
    console.log(`- Deleted ${delAchieve.count} achievements`);

    // 2. Clear all student profiles in all standards
    const delProfiles = await prisma.studentProfile.deleteMany();
    console.log(`- Deleted ${delProfiles.count} student profiles across all standards`);

    // 3. Clear all homework & study materials created by previous teacher accounts (if any)
    const delHw = await prisma.homework.deleteMany();
    console.log(`- Deleted ${delHw.count} teacher homework records`);

    const delMat = await prisma.studyMaterial.deleteMany();
    console.log(`- Deleted ${delMat.count} teacher study materials`);

    const delVidAcc = await prisma.videoLectureAccess.deleteMany();
    console.log(`- Deleted ${delVidAcc.count} video lecture accesses`);

    const delVids = await prisma.videoLecture.deleteMany();
    console.log(`- Deleted ${delVids.count} video lectures`);

    // Detach uploaderId on textbook documents to avoid FK constraint
    await prisma.textbookDocument.updateMany({ data: { uploaderId: null } });

    // 4. Delete all user accounts (emails and passwords)
    const delUsers = await prisma.user.deleteMany();
    console.log(`- Deleted ${delUsers.count} user accounts (all emails and passwords cleared)`);

    // 5. Clean up uploaded files on disk (avatars, homework submissions, videos)
    const fs = require('fs');
    const path = require('path');
    const uploadDirs = ['avatars', 'homework', 'videos', 'materials'];
    for (const dir of uploadDirs) {
      const dirPath = path.join(__dirname, '..', 'uploads', dir);
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
          if (file.startsWith('mat-seed-')) continue; // preserve starter template files
          const filePath = path.join(dirPath, file);
          if (fs.statSync(filePath).isFile()) {
            try {
              fs.unlinkSync(filePath);
              console.log(`- Removed uploaded file: ${dir}/${file}`);
            } catch (fileErr) {
              console.warn(`Could not remove ${dir}/${file}:`, fileErr.message);
            }
          }
        }
      }
    }

    // Check remaining counts
    const remainingUsers = await prisma.user.count();
    const remainingProfiles = await prisma.studentProfile.count();
    const remainingSubjects = await prisma.subject.count();
    const remainingQuestions = await prisma.question.count();
    const remainingTests = await prisma.test.count();

    console.log('\n✅ Cleanup complete:');
    console.log(`  Users remaining (emails/passwords): ${remainingUsers}`);
    console.log(`  Profiles remaining (all standards): ${remainingProfiles}`);
    console.log(`  Subjects preserved: ${remainingSubjects}`);
    console.log(`  Questions preserved: ${remainingQuestions}`);
    console.log(`  Tests preserved: ${remainingTests}`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllProfilesAndCredentials();
