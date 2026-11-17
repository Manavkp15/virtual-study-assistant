const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function clearAllProfilesAndCredentials() {
  console.log('🧹 Starting complete removal of all user profiles, accounts, emails, and credentials...');

  try {
    // 1. Delete user-specific activity & child relations in proper dependency order
    const delTeacherSubjects = await prisma.teacherSubjectMapping.deleteMany({});
    console.log(`- Deleted TeacherSubjectMappings: ${delTeacherSubjects.count}`);

    const delRemedialAnswers = await prisma.remedialSessionAnswer.deleteMany({});
    console.log(`- Deleted RemedialSessionAnswers: ${delRemedialAnswers.count}`);

    const delRemedialSessions = await prisma.remedialSession.deleteMany({});
    console.log(`- Deleted RemedialSessions: ${delRemedialSessions.count}`);

    const delHwHistory = await prisma.homeworkSubmissionHistory.deleteMany({});
    console.log(`- Deleted HomeworkSubmissionHistories: ${delHwHistory.count}`);

    const delHwSubmissions = await prisma.homeworkSubmission.deleteMany({});
    console.log(`- Deleted HomeworkSubmissions: ${delHwSubmissions.count}`);

    const delHomeworks = await prisma.homework.deleteMany({});
    console.log(`- Deleted Homeworks: ${delHomeworks.count}`);

    const delMatAccess = await prisma.studyMaterialAccess.deleteMany({});
    console.log(`- Deleted StudyMaterialAccesses: ${delMatAccess.count}`);

    const delMaterials = await prisma.studyMaterial.deleteMany({});
    console.log(`- Deleted StudyMaterials: ${delMaterials.count}`);

    const delVidAccess = await prisma.videoLectureAccess.deleteMany({});
    console.log(`- Deleted VideoLectureAccesses: ${delVidAccess.count}`);

    const delVideos = await prisma.videoLecture.deleteMany({});
    console.log(`- Deleted VideoLectures: ${delVideos.count}`);

    const delAiChecks = await prisma.aiHomeworkCheck.deleteMany({});
    console.log(`- Deleted AiHomeworkChecks: ${delAiChecks.count}`);

    const delStudentAnswers = await prisma.studentAnswer.deleteMany({});
    console.log(`- Deleted StudentAnswers: ${delStudentAnswers.count}`);

    const delTestAttempts = await prisma.testAttempt.deleteMany({});
    console.log(`- Deleted TestAttempts: ${delTestAttempts.count}`);

    const delTopicPerfs = await prisma.topicPerformance.deleteMany({});
    console.log(`- Deleted TopicPerformances: ${delTopicPerfs.count}`);

    const delMistakes = await prisma.mistakeBookEntry.deleteMany({});
    console.log(`- Deleted MistakeBookEntries: ${delMistakes.count}`);

    const delStudyTasks = await prisma.studyTask.deleteMany({});
    console.log(`- Deleted StudyTasks: ${delStudyTasks.count}`);

    const delStudyPlans = await prisma.studyPlan.deleteMany({});
    console.log(`- Deleted StudyPlans: ${delStudyPlans.count}`);

    const delNotifications = await prisma.notification.deleteMany({});
    console.log(`- Deleted Notifications: ${delNotifications.count}`);

    const delAchievements = await prisma.achievement.deleteMany({});
    console.log(`- Deleted Achievements: ${delAchievements.count}`);

    // Set any textbook document uploaderId to null so no FK prevents user deletion
    const updatedDocs = await prisma.textbookDocument.updateMany({
      data: { uploaderId: null }
    });
    console.log(`- Detached uploaderId on TextbookDocuments: ${updatedDocs.count}`);

    // 2. Delete all student profiles
    const delProfiles = await prisma.studentProfile.deleteMany({});
    console.log(`- Deleted StudentProfiles: ${delProfiles.count}`);

    // 3. Delete all users (emails, passwords, accounts)
    const delUsers = await prisma.user.deleteMany({});
    console.log(`- Deleted Users (all emails & password hashes removed): ${delUsers.count}`);

    // 4. Clean up avatar files from disk
    const avatarDir = path.resolve(__dirname, '../uploads/avatars');
    if (fs.existsSync(avatarDir)) {
      const files = fs.readdirSync(avatarDir);
      for (const file of files) {
        try {
          fs.unlinkSync(path.join(avatarDir, file));
          console.log(`- Removed avatar file: ${file}`);
        } catch (e) {
          console.warn(`Failed to remove avatar file ${file}:`, e.message);
        }
      }
    }

    // 5. Verify counts
    const remainingUsers = await prisma.user.count();
    const remainingProfiles = await prisma.studentProfile.count();

    console.log('--------------------------------------------------');
    console.log(`✅ COMPLETE: All profiles and credentials cleared!`);
    console.log(`Remaining users in DB: ${remainingUsers}`);
    console.log(`Remaining profiles in DB: ${remainingProfiles}`);
    console.log(`All previously used emails are now completely free to reuse for creating new profiles!`);
    console.log('--------------------------------------------------');
  } catch (error) {
    console.error('❌ Error clearing profiles:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllProfilesAndCredentials();
