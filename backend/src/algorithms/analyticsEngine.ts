import { prisma } from '../database/prisma';

export interface ComprehensiveAnalytics {
  overallScore: number;
  averagePercentage: number;
  accuracy: number;
  testsCompleted: number;
  totalTimeTakenSeconds: number;
  avgTimePerQuestionSeconds: number;
  totalCorrect: number;
  totalWrong: number;
  totalUnanswered: number;
  correctToWrongRatio: number;
  improvementRate: number;
  consistencyScore: number;
  subjectPerformance: Array<{
    subjectId: string;
    subjectName: string;
    subjectNameGu?: string;
    code: string;
    icon: string;
    averagePercentage: number;
    testsAttempted: number;
    accuracy: number;
  }>;
  difficultyPerformance: Array<{
    difficulty: string;
    totalQuestions: number;
    correctCount: number;
    accuracy: number;
  }>;
  recentTrends: Array<{
    attemptId: string;
    testTitle: string;
    testTitleGu?: string;
    date: string;
    percentage: number;
    accuracy: number;
  }>;
}

export async function calculateStudentAnalytics(userId: string): Promise<ComprehensiveAnalytics> {
  const attempts = await prisma.testAttempt.findMany({
    where: { userId },
    include: {
      test: {
        include: {
          subject: true
        }
      },
      studentAnswers: {
        include: {
          question: true
        }
      }
    },
    orderBy: { completedAt: 'asc' }
  });

  if (attempts.length === 0) {
    return {
      overallScore: 0,
      averagePercentage: 0,
      accuracy: 0,
      testsCompleted: 0,
      totalTimeTakenSeconds: 0,
      avgTimePerQuestionSeconds: 0,
      totalCorrect: 0,
      totalWrong: 0,
      totalUnanswered: 0,
      correctToWrongRatio: 0,
      improvementRate: 0,
      consistencyScore: 0,
      subjectPerformance: [],
      difficultyPerformance: [],
      recentTrends: []
    };
  }

  let totalScore = 0;
  let totalMaxScore = 0;
  let totalPercentageSum = 0;
  let totalTimeSeconds = 0;
  let totalCorrect = 0;
  let totalWrong = 0;
  let totalUnanswered = 0;

  const subjectMap = new Map<string, {
    subjectId: string;
    subjectName: string;
    subjectNameGu?: string;
    code: string;
    icon: string;
    percentageSum: number;
    testCount: number;
    correctCount: number;
    totalQuestions: number;
  }>();

  const difficultyMap = new Map<string, { total: number; correct: number }>();

  attempts.forEach((att) => {
    totalScore += att.score;
    totalMaxScore += att.maxScore;
    totalPercentageSum += att.percentage;
    totalTimeSeconds += att.timeTakenSeconds;
    totalCorrect += att.correctCount;
    totalWrong += att.wrongCount;
    totalUnanswered += att.unansweredCount;

    // Subject grouping
    const sub = att.test.subject;
    const existingSub = subjectMap.get(sub.id) || {
      subjectId: sub.id,
      subjectName: sub.name,
      subjectNameGu: sub.nameGu || sub.name,
      code: sub.code,
      icon: sub.icon,
      percentageSum: 0,
      testCount: 0,
      correctCount: 0,
      totalQuestions: 0
    };
    existingSub.percentageSum += att.percentage;
    existingSub.testCount += 1;
    existingSub.correctCount += att.correctCount;
    existingSub.totalQuestions += (att.correctCount + att.wrongCount + att.unansweredCount);
    subjectMap.set(sub.id, existingSub);

    // Difficulty grouping
    att.studentAnswers.forEach((sa) => {
      const diff = sa.question.difficulty;
      const existingDiff = difficultyMap.get(diff) || { total: 0, correct: 0 };
      existingDiff.total += 1;
      if (sa.isCorrect) existingDiff.correct += 1;
      difficultyMap.set(diff, existingDiff);
    });
  });

  const testsCompleted = attempts.length;
  const averagePercentage = Math.round((totalPercentageSum / testsCompleted) * 10) / 10;
  const totalAnsweredQuestions = totalCorrect + totalWrong;
  const accuracy = totalAnsweredQuestions > 0
    ? Math.round((totalCorrect / (totalCorrect + totalWrong + totalUnanswered)) * 1000) / 10
    : 0;
  const avgTimePerQuestion = totalAnsweredQuestions > 0
    ? Math.round(totalTimeSeconds / totalAnsweredQuestions)
    : 0;
  const correctToWrongRatio = totalWrong > 0
    ? Math.round((totalCorrect / totalWrong) * 100) / 100
    : totalCorrect;

  // Calculate Improvement Rate (Difference between last half & first half of test attempts)
  let improvementRate = 0;
  if (attempts.length >= 2) {
    const firstScore = attempts[0].percentage;
    const latestScore = attempts[attempts.length - 1].percentage;
    improvementRate = Math.round((latestScore - firstScore) * 10) / 10;
  }

  // Calculate Consistency Score (100 - standard deviation of percentage)
  let consistencyScore = 100;
  if (attempts.length > 1) {
    const mean = totalPercentageSum / attempts.length;
    const variance = attempts.reduce((acc, a) => acc + Math.pow(a.percentage - mean, 2), 0) / attempts.length;
    const stdDev = Math.sqrt(variance);
    consistencyScore = Math.max(0, Math.round((100 - stdDev) * 10) / 10);
  }

  const subjectPerformance = Array.from(subjectMap.values()).map(s => ({
    subjectId: s.subjectId,
    subjectName: s.subjectName,
    subjectNameGu: s.subjectNameGu,
    code: s.code,
    icon: s.icon,
    averagePercentage: Math.round((s.percentageSum / s.testCount) * 10) / 10,
    testsAttempted: s.testCount,
    accuracy: s.totalQuestions > 0 ? Math.round((s.correctCount / s.totalQuestions) * 1000) / 10 : 0
  }));

  const difficultyPerformance = Array.from(difficultyMap.entries()).map(([diff, val]) => ({
    difficulty: diff,
    totalQuestions: val.total,
    correctCount: val.correct,
    accuracy: val.total > 0 ? Math.round((val.correct / val.total) * 1000) / 10 : 0
  }));

  const recentTrends = attempts.map(att => ({
    attemptId: att.id,
    testTitle: att.test.title,
    testTitleGu: att.test.titleGu || att.test.title,
    date: att.completedAt.toISOString().split('T')[0],
    percentage: att.percentage,
    accuracy: att.accuracy
  }));

  return {
    overallScore: Math.round((totalScore / (totalMaxScore || 1)) * 1000) / 10,
    averagePercentage,
    accuracy,
    testsCompleted,
    totalTimeTakenSeconds: totalTimeSeconds,
    avgTimePerQuestionSeconds: avgTimePerQuestion,
    totalCorrect,
    totalWrong,
    totalUnanswered,
    correctToWrongRatio,
    improvementRate,
    consistencyScore,
    subjectPerformance,
    difficultyPerformance,
    recentTrends
  };
}
