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

export const getParentStudentOverview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parentUserId = req.user?.id;
    if (!parentUserId) return res.status(401).json({ error: 'Unauthorized' });

    let targetStudentId = String(req.query.studentId || '');
    if (!targetStudentId) {
      if (req.user?.role === 'STUDENT') {
        targetStudentId = req.user.id;
      } else {
        const mapping = await prisma.parentStudentMapping.findFirst({
          where: { parentId: parentUserId }
        });
        targetStudentId = mapping?.studentId || '';
      }
    }

    if (!targetStudentId) {
      const firstStudent = await prisma.user.findFirst({
        where: { role: 'STUDENT' },
        select: { id: true }
      });
      targetStudentId = firstStudent?.id || '';
    }

    const studentUser = await prisma.user.findUnique({
      where: { id: targetStudentId },
      include: { profile: true }
    });

    if (!studentUser) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const [analytics, weakData, prediction, attempts, homeworks] = await Promise.all([
      calculateStudentAnalytics(targetStudentId),
      detectWeakTopics(targetStudentId),
      predictPerformance(targetStudentId),
      prisma.testAttempt.findMany({
        where: { userId: targetStudentId },
        include: { test: { include: { subject: true } } },
        orderBy: { completedAt: 'desc' },
        take: 15
      }),
      prisma.homework.findMany({
        where: {
          OR: [
            { standard: studentUser.profile?.standard || 'Standard 8' },
            { standard: 'ALL' }
          ]
        },
        include: {
          subject: true,
          submissions: {
            where: { studentId: targetStudentId }
          }
        },
        orderBy: { dueDate: 'desc' }
      })
    ]);

    const totalHomework = homeworks.length;
    const submittedHomework = homeworks.filter(h => h.submissions.length > 0 && h.submissions[0].status !== 'PENDING' && h.submissions[0].status !== 'LATE').length;
    const approvedHomework = homeworks.filter(h => h.submissions[0]?.isTeacherApproved).length;
    const pendingHomework = totalHomework - submittedHomework;

    // AI Guidance tailored for parents
    let parentGuidanceEn = 'Your child is maintaining steady progress. Encourage consistent daily practice and active revision.';
    let parentGuidanceGu = 'તમારા બાળકનો અભ્યાસ સારો ચાલી રહ્યો છે. દૈનિક સમયપત્રક મુજબ નિયમિત વાંચન અને પુનરાવર્તન માટે પ્રોત્સાહિત કરો.';
    let parentGuidanceHi = 'आपका बच्चा अच्छी प्रगति कर रहा है। नियमित अध्ययन और पुनरावृत्ति के लिए प्रोत्साहित करें।';

    if (analytics.averagePercentage >= 85) {
      parentGuidanceEn = 'Outstanding performance! Your child is showing excellent concept mastery across all subjects. Keep up the encouragement!';
      parentGuidanceGu = 'અદ્ભુત પ્રદર્શન! તમારા બાળકે વિષયોમાં ઉત્તમ નિપુણતા મેળવી છે. આ જ ગતિ અને આત્મવિશ્વાસ જાળવી રાખવા પ્રેરણા આપો.';
      parentGuidanceHi = 'उत्कृष्ट प्रदर्शन! आपके बच्चे ने विषयों में गहरी समझ हासिल की है। इसी तरह आत्मविश्वास बनाए रखने में मदद करें।';
    } else if (analytics.averagePercentage < 65) {
      parentGuidanceEn = 'Attention needed in weak topics. We recommend dedicating 30 minutes daily to basic concept clearance and doubt clearing.';
      parentGuidanceGu = 'કેટલાક નબળા મુદ્દાઓ પર વિશેષ ધ્યાન આપવાની જરૂર છે. શંકા નિવારણ અને મૂળભૂત ખ્યાલો સ્પષ્ટ કરવા માટે દૈનિક ૩૦ મિનિટ વધારાનો સમય ફાળવવાની ભલામણ છે.';
      parentGuidanceHi = 'कुछ कमजोर टॉपिक पर ध्यान देने की आवश्यकता है। मूल अवधारणाओं को स्पष्ट करने के लिए दैनिक 30 मिनट अतिरिक्त समय देने की सलाह दी जाती है।';
    }

    res.json({
      student: {
        id: studentUser.id,
        name: studentUser.name,
        email: studentUser.email,
        standard: studentUser.profile?.standard || 'Standard 8',
        division: studentUser.profile?.division || 'A',
        rollNumber: studentUser.profile?.rollNumber || null,
        streakCount: studentUser.profile?.streakCount || 1,
        availableHoursPerDay: studentUser.profile?.availableHoursPerDay || 2.5,
        targetPercentage: studentUser.profile?.targetPercentage || 85.0,
        udiseCode: studentUser.profile?.udiseCode || null
      },
      summary: {
        overallScore: analytics.overallScore,
        averagePercentage: analytics.averagePercentage,
        accuracy: analytics.accuracy,
        testsCompleted: analytics.testsCompleted,
        improvementRate: analytics.improvementRate,
        consistencyScore: analytics.consistencyScore,
        studyStreak: studentUser.profile?.streakCount || 1,
        totalHomework,
        submittedHomework,
        approvedHomework,
        pendingHomework,
        strongTopicsCount: weakData.strongTopics.length,
        weakTopicsCount: weakData.weakTopics.length
      },
      subjectPerformance: analytics.subjectPerformance,
      weakTopics: weakData.weakTopics.slice(0, 8),
      strongTopics: weakData.strongTopics.slice(0, 8),
      prediction,
      parentGuidance: {
        en: parentGuidanceEn,
        gu: parentGuidanceGu,
        hi: parentGuidanceHi
      },
      recentTests: attempts.map(rt => ({
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
      }))
    });
  } catch (error) {
    console.error('getParentStudentOverview error:', error);
    res.status(500).json({ error: 'Failed to fetch parent student overview' });
  }
};

export const updateParentStudentSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parentUserId = req.user?.id;
    if (!parentUserId) return res.status(401).json({ error: 'Unauthorized' });

    let targetStudentId = String(req.body.studentId || '');
    if (!targetStudentId) {
      if (req.user?.role === 'STUDENT') {
        targetStudentId = req.user.id;
      } else {
        const mapping = await prisma.parentStudentMapping.findFirst({
          where: { parentId: parentUserId }
        });
        targetStudentId = mapping?.studentId || '';
      }
    }

    if (!targetStudentId) {
      return res.status(400).json({ error: 'Target student not identified' });
    }

    const { availableHoursPerDay, targetPercentage } = req.body;

    const updatedProfile = await prisma.studentProfile.upsert({
      where: { userId: targetStudentId },
      update: {
        availableHoursPerDay: availableHoursPerDay !== undefined ? parseFloat(availableHoursPerDay) : undefined,
        targetPercentage: targetPercentage !== undefined ? parseFloat(targetPercentage) : undefined
      },
      create: {
        userId: targetStudentId,
        availableHoursPerDay: availableHoursPerDay ? parseFloat(availableHoursPerDay) : 2.5,
        targetPercentage: targetPercentage ? parseFloat(targetPercentage) : 85.0
      }
    });

    res.json({
      success: true,
      message: 'Parent settings updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('updateParentStudentSettings error:', error);
    res.status(500).json({ error: 'Failed to update parent student settings' });
  }
};
