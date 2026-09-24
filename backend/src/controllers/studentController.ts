import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../database/prisma';
import { calculateStudentAnalytics } from '../algorithms/analyticsEngine';
import { detectWeakTopics } from '../algorithms/weakTopicDetector';
import { predictPerformance } from '../algorithms/predictionEngine';
import { getRecommendedTests } from '../algorithms/testRecommender';
import { generateAIGuidance } from '../ai/aiService';

export const getDashboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const lang = (req.query.lang as string) || (req.headers['accept-language']?.includes('gu') ? 'gu' : (req.headers['accept-language']?.includes('hi') ? 'hi' : 'en'));
    const analytics = await calculateStudentAnalytics(userId);
    const weakData = await detectWeakTopics(userId);
    const prediction = await predictPerformance(userId);
    const recommendedTests = await getRecommendedTests(userId);
    const aiGuidance = await generateAIGuidance(userId, lang);

    const profile = await prisma.studentProfile.findUnique({ where: { userId } });

    // Fetch recent test results
    const recentTests = await prisma.testAttempt.findMany({
      where: { userId },
      include: { test: { include: { subject: true } } },
      orderBy: { completedAt: 'desc' },
      take: 5
    });

    const summaryCards = {
      overallScore: analytics.overallScore,
      averagePercentage: analytics.averagePercentage,
      accuracy: analytics.accuracy,
      testsCompleted: analytics.testsCompleted,
      strongTopicsCount: weakData.strongTopics.length,
      weakTopicsCount: weakData.weakTopics.length,
      improvementPercentage: analytics.improvementRate,
      studyStreak: profile?.streakCount || 1
    };

    res.json({
      summaryCards,
      analyticsOverview: analytics,
      weakTopics: weakData.weakTopics,
      strongTopics: weakData.strongTopics,
      studyPriority: weakData.weakTopics.slice(0, 4),
      recommendedTests: recommendedTests.slice(0, 3),
      aiGuidance,
      recentTestResults: recentTests.map(rt => ({
        id: rt.id,
        testTitle: rt.test.title,
        testTitleGu: rt.test.titleGu || rt.test.title,
        subjectName: rt.test.subject.name,
        subjectNameGu: rt.test.subject.nameGu || rt.test.subject.name,
        score: rt.score,
        maxScore: rt.maxScore,
        percentage: rt.percentage,
        accuracy: rt.accuracy,
        completedAt: rt.completedAt
      })),
      prediction
    });
  } catch (error: any) {
    console.error('getDashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
};

export const getPerformance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const analytics = await calculateStudentAnalytics(userId);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch performance analytics' });
  }
};

export const getWeakTopics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const data = await detectWeakTopics(userId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch weak topics' });
  }
};

export const getTopicHeatmap = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const profile = await prisma.studentProfile.findUnique({ where: { userId } });
    const userRole = req.user?.role;

    // Standard-wise filtering for students
    const where: any = {};
    if (userRole === 'STUDENT' && profile?.standard) {
      where.standard = profile.standard;
    }

    const subjects = await prisma.subject.findMany({
      where,
      include: {
        chapters: {
          include: {
            topics: {
              include: {
                performances: {
                  where: { userId }
                }
              }
            }
          }
        }
      }
    });

    const heatmap = subjects.map(sub => ({
      subjectId: sub.id,
      subjectName: sub.name,
      subjectNameGu: sub.nameGu || sub.name,
      code: sub.code,
      standard: sub.standard,
      chapters: sub.chapters.map(ch => ({
        chapterId: ch.id,
        chapterName: ch.name,
        chapterNameGu: ch.nameGu || ch.name,
        topics: ch.topics.map(t => {
          const perf = t.performances[0];
          let status = perf ? perf.status : 'UNSTUDIED';
          let accuracy = perf ? perf.accuracy : 0;
          let badge = '⚪'; // Grey for unstudied

          if (status === 'EXCELLENT') badge = '🟢';
          else if (status === 'STRONG') badge = '🟢';
          else if (status === 'AVERAGE') badge = '🟡';
          else if (status === 'NEEDS_IMPROVEMENT') badge = '🟠';
          else if (status === 'CRITICAL') badge = '🔴';

          return {
            topicId: t.id,
            topicName: t.name,
            topicNameGu: t.nameGu || t.name,
            accuracy,
            status,
            badge,
            repeatedMistakes: perf?.repeatedMistakes || 0,
            attemptCount: perf?.attemptCount || 0
          };
        })
      }))
    }));

    res.json({ heatmap, studentStandard: profile?.standard || 'Standard 8' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load topic heatmap' });
  }
};

export const getPredictions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const prediction = await predictPerformance(userId);
    res.json(prediction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch predictions' });
  }
};

export const getSubjectsList = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const profile = userId ? await prisma.studentProfile.findUnique({ where: { userId } }) : null;
    const userRole = req.user?.role;
    const { standard } = req.query;

    // For students, strictly filter by their existing standard only
    const where: any = {};
    if (userRole === 'STUDENT') {
      where.standard = profile?.standard || 'Standard 8';
    } else if (standard && standard !== 'ALL') {
      where.standard = String(standard);
    }

    const [subjects, distinctStandards] = await Promise.all([
      prisma.subject.findMany({
        where,
        include: {
          chapters: {
            include: {
              topics: true
            }
          }
        }
      }),
      prisma.subject.findMany({
        select: { standard: true },
        distinct: ['standard']
      })
    ]);

    const existingStandards = distinctStandards.map(s => s.standard).filter(Boolean);

    res.json({
      subjects,
      studentStandard: profile?.standard || 'Standard 8',
      existingStandards
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subjects list' });
  }
};
