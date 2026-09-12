import { prisma } from '../database/prisma';

export interface TestRecommendation {
  testId: string;
  testTitle: string;
  testTitleGu?: string;
  subjectName: string;
  subjectNameGu?: string;
  recommendedDifficulty: 'BASIC' | 'MEDIUM' | 'ADVANCED' | 'CHALLENGE' | 'REVISION';
  reason: string;
  reasonGu: string;
  matchScore: number;
}

export async function getRecommendedTests(userId: string): Promise<TestRecommendation[]> {
  // Get student's overall accuracy & topic performances
  const attempts = await prisma.testAttempt.findMany({
    where: { userId },
    orderBy: { completedAt: 'desc' }
  });

  const latestAccuracy = attempts.length > 0 ? attempts[0].accuracy : 60;

  const criticalPerformances = await prisma.topicPerformance.findMany({
    where: {
      userId,
      OR: [{ status: 'CRITICAL' }, { repeatedMistakes: { gte: 2 } }]
    },
    include: {
      topic: {
        include: {
          chapter: {
            include: {
              subject: true
            }
          }
        }
      }
    }
  });

  const availableTests = await prisma.test.findMany({
    include: {
      subject: true,
      testQuestions: {
        include: {
          question: true
        }
      }
    }
  });

  let targetDifficulty: 'BASIC' | 'MEDIUM' | 'ADVANCED' | 'CHALLENGE' | 'REVISION' = 'MEDIUM';
  if (latestAccuracy < 50) targetDifficulty = 'BASIC';
  else if (latestAccuracy >= 50 && latestAccuracy < 70) targetDifficulty = 'MEDIUM';
  else if (latestAccuracy >= 70 && latestAccuracy < 85) targetDifficulty = 'ADVANCED';
  else targetDifficulty = 'CHALLENGE';

  const recommendations: TestRecommendation[] = [];

  // Check if there are repeated mistakes requiring a REVISION test
  if (criticalPerformances.length > 0) {
    const revisionTest = availableTests.find(t => t.difficulty === 'BASIC' || t.difficulty === 'REVISION');

    if (revisionTest) {
      const topTopic = criticalPerformances[0].topic;
      recommendations.push({
        testId: revisionTest.id,
        testTitle: revisionTest.title,
        testTitleGu: revisionTest.titleGu || revisionTest.title,
        subjectName: revisionTest.subject.name,
        subjectNameGu: revisionTest.subject.nameGu || revisionTest.subject.name,
        recommendedDifficulty: 'REVISION',
        reason: `Repeated mistakes detected in ${topTopic.name}. Recommended for immediate remediation.`,
        reasonGu: `${topTopic.nameGu || topTopic.name} માં વારંવાર ભૂલો નોંધાઈ છે. તાત્કાલિક સુધારણા માટે ભલામણ કરેલ છે.`,
        matchScore: 98
      });
    }
  }

  // Find tests matching target difficulty
  availableTests.forEach((t) => {
    if (recommendations.some(r => r.testId === t.id)) return;

    let matchScore = 70;
    let reason = '';
    let reasonGu = '';

    if (t.difficulty === targetDifficulty) {
      matchScore = 90;
      reason = `Based on your recent accuracy of ${latestAccuracy}%, this ${targetDifficulty} test will optimize your learning curve.`;
      reasonGu = `તમારી તાજેતરની ${latestAccuracy}% ચોકસાઈના આધારે, આ ટેસ્ટ તમારી શીખવાની પ્રક્રિયાને વધુ ઝડપી બનાવશે.`;
    } else {
      reason = `Recommended practice test for ${t.subject.name} to test your knowledge.`;
      reasonGu = `તમારા જ્ઞાનની ચકાસણી કરવા માટે ${t.subject.nameGu || t.subject.name} નો ભલામણ કરેલ પ્રેક્ટિસ ટેસ્ટ.`;
    }

    recommendations.push({
      testId: t.id,
      testTitle: t.title,
      testTitleGu: t.titleGu || t.title,
      subjectName: t.subject.name,
      subjectNameGu: t.subject.nameGu || t.subject.name,
      recommendedDifficulty: t.difficulty as any,
      reason,
      reasonGu,
      matchScore
    });
  });

  return recommendations.sort((a, b) => b.matchScore - a.matchScore);
}
