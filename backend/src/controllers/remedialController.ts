import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../database/prisma';
import { enrichWithStepByStepSolution } from '../ai/stepByStepSolver';

/**
 * Creates or retrieves a RemedialSession when a test attempt scores < 50%
 */
export const createFromAttempt = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const attemptId = req.params.attemptId || req.body.attemptId;

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        test: {
          include: {
            subject: true
          }
        },
        studentAnswers: {
          include: {
            question: {
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
            }
          }
        }
      }
    });

    if (!attempt) return res.status(404).json({ error: 'Test attempt not found' });
    if (attempt.userId !== userId) return res.status(403).json({ error: 'Access denied' });

    // Check if an active/existing remedial session already exists for this attempt
    const existingSession = await prisma.remedialSession.findFirst({
      where: {
        userId,
        testAttemptId: attempt.id
      },
      include: {
        chapter: true,
        subject: true
      }
    });

    if (existingSession && existingSession.status !== 'COMPLETED') {
      return res.json({
        success: true,
        session: existingSession,
        supportMessage: "Let's improve this topic! You may need a little more practice with this chapter.",
        supportMessageGu: "ચાલો આ વિષયને સુધારીએ! તમને આ પ્રકરણમાં થોડી વધુ પ્રેક્ટિસની જરૂર પડી શકે છે."
      });
    }

    // Identify weak chapter & topics from incorrect answers
    const chapterMistakeCounts = new Map<string, { chapter: any; mistakeCount: number; weakTopics: Map<string, any> }>();

    for (const sa of attempt.studentAnswers) {
      if (!sa.isCorrect) {
        const ch = sa.question.topic.chapter;
        const tp = sa.question.topic;

        if (!chapterMistakeCounts.has(ch.id)) {
          chapterMistakeCounts.set(ch.id, {
            chapter: ch,
            mistakeCount: 0,
            weakTopics: new Map()
          });
        }

        const data = chapterMistakeCounts.get(ch.id)!;
        data.mistakeCount += 1;
        data.weakTopics.set(tp.id, {
          id: tp.id,
          name: tp.name,
          nameGu: tp.nameGu,
          description: tp.description,
          descriptionGu: tp.descriptionGu
        });
      }
    }

    // Pick chapter with highest mistake count
    let primaryChapter: any = null;
    let maxMistakes = -1;
    let weakTopicsList: any[] = [];

    for (const entry of chapterMistakeCounts.values()) {
      if (entry.mistakeCount > maxMistakes) {
        maxMistakes = entry.mistakeCount;
        primaryChapter = entry.chapter;
        weakTopicsList = Array.from(entry.weakTopics.values());
      }
    }

    // Fallback: If all answers were somehow correct or no specific chapter found, pick first chapter of test
    if (!primaryChapter) {
      const firstQ = attempt.studentAnswers[0]?.question;
      if (firstQ) {
        primaryChapter = firstQ.topic.chapter;
        weakTopicsList = [{ id: firstQ.topic.id, name: firstQ.topic.name, nameGu: firstQ.topic.nameGu }];
      } else {
        return res.status(400).json({ error: 'No question data available for remedial analysis' });
      }
    }

    // Build curated revision notes for this weak chapter
    const revisionNotes = `### 📚 Chapter Revision: ${primaryChapter.name}
${primaryChapter.nameGu ? `**(${primaryChapter.nameGu})**\n` : ''}
Key areas to strengthen based on your recent quiz attempt:

${weakTopicsList.map(wt => `#### 💡 ${wt.name} ${wt.nameGu ? `(${wt.nameGu})` : ''}
- ${wt.description || 'Focus on fundamental definitions, properties, and core problem-solving techniques.'}
- Review the standard formulas and step-by-step example derivations.
- Pay special attention to unit conversions and sign rules.`).join('\n\n')}

#### 🎯 Key Revision Tips
1. Break complex problems into smaller sub-steps.
2. Verify each intermediate step before concluding the final answer.
3. Keep practicing with confidence — you are just a few steps away from mastery!`;

    const revisionNotesGu = `### 📚 પ્રકરણ પુનરાવર્તન: ${primaryChapter.nameGu || primaryChapter.name}

તમારા તાજેતરના ક્વિઝ પરિણામ મુજબ નીચેના મુદ્દાઓ પર વધુ ધ્યાન આપો:

${weakTopicsList.map(wt => `#### 💡 ${wt.nameGu || wt.name}
- ${wt.descriptionGu || wt.description || 'મૂળભૂત વ્યાખ્યાઓ, ગુણધર્મો અને ઉદાહરણો પર ધ્યાન કેન્દ્રિત કરો.'}
- પ્રમાણભૂત સૂત્રો અને તબક્કાવાર પદ્ધતિની સમીક્ષા કરો.`).join('\n\n')}

#### 🎯 પુનરાવર્તનની મહત્વની ટિપ્સ
૧. પ્રશ્નને ધ્યાનપૂર્વક વાંચીને જરૂરી વિગતો તારવો.
૨. શાંતિથી પુનરાવર્તન કરો — પ્રેક્ટિસથી પરિણામ હંમેશા ઉત્તમ બને છે!`;

    const session = await prisma.remedialSession.create({
      data: {
        userId,
        testAttemptId: attempt.id,
        testId: attempt.testId,
        subjectId: primaryChapter.subjectId,
        chapterId: primaryChapter.id,
        initialPercentage: attempt.percentage,
        weakTopicsSummary: JSON.stringify(weakTopicsList),
        revisionNotes,
        revisionNotesGu,
        status: 'PENDING_REVISION'
      },
      include: {
        chapter: true,
        subject: true
      }
    });

    res.json({
      success: true,
      session,
      weakChapter: {
        id: primaryChapter.id,
        name: primaryChapter.name,
        nameGu: primaryChapter.nameGu,
        subjectName: attempt.test.subject.name,
        subjectNameGu: attempt.test.subject.nameGu
      },
      weakTopics: weakTopicsList,
      supportMessage: "Let's improve this topic! You may need a little more practice with this chapter.",
      supportMessageGu: "ચાલો આ વિષયને સુધારીએ! તમને આ પ્રકરણમાં થોડી વધુ પ્રેક્ટિસની જરૂર પડી શકે છે."
    });
  } catch (error: any) {
    console.error('createFromAttempt error:', error);
    res.status(500).json({ error: 'Failed to initialize remedial session' });
  }
};

/**
 * Gets session details, revision notes, and attached study materials
 */
export const getSession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.params;

    const session = await prisma.remedialSession.findUnique({
      where: { id: sessionId },
      include: {
        chapter: {
          include: {
            topics: true,
            subject: true
          }
        },
        subject: true
      }
    });

    if (!session) return res.status(404).json({ error: 'Remedial session not found' });
    if (session.userId !== userId) return res.status(403).json({ error: 'Access denied' });

    // Fetch relevant study materials and video lectures for this chapter
    const [materials, videos] = await Promise.all([
      prisma.studyMaterial.findMany({
        where: {
          chapterId: session.chapterId,
          status: 'PUBLISHED'
        },
        select: {
          id: true,
          title: true,
          titleGu: true,
          description: true,
          pdfFilePath: true,
          pdfFileName: true,
          fileSizeBytes: true
        },
        take: 3
      }),
      prisma.videoLecture.findMany({
        where: {
          chapterId: session.chapterId,
          status: 'PUBLISHED'
        },
        select: {
          id: true,
          title: true,
          titleGu: true,
          videoFilePath: true,
          videoFileName: true,
          durationSeconds: true
        },
        take: 3
      })
    ]);

    let weakTopics: any[] = [];
    try {
      if (session.weakTopicsSummary) {
        weakTopics = JSON.parse(session.weakTopicsSummary);
      }
    } catch {
      weakTopics = [];
    }

    res.json({
      success: true,
      session: {
        ...session,
        weakTopics,
        studyMaterials: materials,
        videoLectures: videos
      }
    });
  } catch (error: any) {
    console.error('getSession error:', error);
    res.status(500).json({ error: 'Failed to retrieve remedial session' });
  }
};

/**
 * Delivers a short, focused 5-question remedial test for the weak chapter
 */
export const getRemedialTest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.params;

    const session = await prisma.remedialSession.findUnique({
      where: { id: sessionId },
      include: { chapter: true, subject: true }
    });

    if (!session) return res.status(404).json({ error: 'Remedial session not found' });
    if (session.userId !== userId) return res.status(403).json({ error: 'Access denied' });

    let weakTopicIds: string[] = [];
    try {
      if (session.weakTopicsSummary) {
        const parsed = JSON.parse(session.weakTopicsSummary);
        weakTopicIds = parsed.map((t: any) => t.id).filter(Boolean);
      }
    } catch {
      weakTopicIds = [];
    }

    // 1. Fetch questions specifically belonging to weak topics first
    let candidates = await prisma.question.findMany({
      where: {
        topic: {
          chapterId: session.chapterId
        },
        ...(weakTopicIds.length > 0 ? { topicId: { in: weakTopicIds } } : {})
      },
      include: {
        topic: true,
        options: {
          select: {
            id: true,
            optionText: true,
            optionTextGu: true
            // Do NOT leak isCorrect
          }
        }
      },
      take: 10
    });

    // 2. If fewer than 5 questions, pull other questions from the same chapter
    if (candidates.length < 5) {
      const moreCandidates = await prisma.question.findMany({
        where: {
          topic: { chapterId: session.chapterId },
          id: { notIn: candidates.map(c => c.id) }
        },
        include: {
          topic: true,
          options: {
            select: {
              id: true,
              optionText: true,
              optionTextGu: true
            }
          }
        },
        take: 5 - candidates.length
      });
      candidates = [...candidates, ...moreCandidates];
    }

    // Shuffle and pick top 5
    const shuffled = candidates.sort(() => Math.random() - 0.5).slice(0, 5);

    // Update session status to TEST_IN_PROGRESS
    await prisma.remedialSession.update({
      where: { id: sessionId },
      data: { status: 'TEST_IN_PROGRESS' }
    });

    const formattedQuestions = shuffled.map((q, idx) => ({
      id: q.id,
      index: idx + 1,
      questionText: q.questionText,
      questionTextGu: q.questionTextGu || q.questionText,
      topicName: q.topic.name,
      topicNameGu: q.topic.nameGu || q.topic.name,
      topicId: q.topicId,
      difficulty: q.difficulty,
      options: q.options.map(opt => ({
        id: opt.id,
        optionText: opt.optionText,
        optionTextGu: opt.optionTextGu || opt.optionText
      }))
    }));

    res.json({
      success: true,
      sessionId: session.id,
      chapterName: session.chapter.name,
      chapterNameGu: session.chapter.nameGu,
      subjectName: session.subject.name,
      subjectNameGu: session.subject.nameGu,
      durationSeconds: 300, // 5 minutes countdown timer
      totalQuestions: formattedQuestions.length,
      questions: formattedQuestions
    });
  } catch (error: any) {
    console.error('getRemedialTest error:', error);
    res.status(500).json({ error: 'Failed to generate remedial test' });
  }
};

/**
 * Submits the remedial test, evaluates answers, calculates improvement, and logs progress
 */
export const submitRemedialTest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.params;
    const { answers, timeTakenSeconds = 0 } = req.body;
    // answers: Array<{ questionId: string; selectedOptionId?: string }>

    const session = await prisma.remedialSession.findUnique({
      where: { id: sessionId },
      include: {
        chapter: true,
        subject: true
      }
    });

    if (!session) return res.status(404).json({ error: 'Remedial session not found' });
    if (session.userId !== userId) return res.status(403).json({ error: 'Access denied' });

    // Fetch questions with actual correct answers
    const questionIds = (answers || []).map((a: any) => a.questionId);
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      include: {
        options: true,
        topic: true
      }
    });

    let correctCount = 0;
    let wrongCount = 0;
    const stillWeakTopicsMap = new Map<string, { id: string; name: string; nameGu?: string | null }>();
    const sessionAnswersToCreate: any[] = [];
    const detailedAnswers: any[] = [];

    for (const userAns of answers || []) {
      const q = questions.find(item => item.id === userAns.questionId);
      if (!q) continue;

      const correctOpt = q.options.find(o => o.isCorrect);
      const isCorrect = correctOpt ? correctOpt.id === userAns.selectedOptionId : false;

      if (isCorrect) {
        correctCount += 1;
      } else {
        wrongCount += 1;
        stillWeakTopicsMap.set(q.topic.id, {
          id: q.topic.id,
          name: q.topic.name,
          nameGu: q.topic.nameGu
        });
      }

      sessionAnswersToCreate.push({
        sessionId,
        questionId: q.id,
        selectedOptionId: userAns.selectedOptionId || null,
        isCorrect
      });

      const selectedOpt = q.options.find(o => o.id === userAns.selectedOptionId);

      detailedAnswers.push({
        questionId: q.id,
        questionText: q.questionText,
        questionTextGu: q.questionTextGu || q.questionText,
        topicName: q.topic.name,
        topicNameGu: q.topic.nameGu || q.topic.name,
        selectedOption: selectedOpt?.optionText || 'Unanswered',
        selectedOptionGu: selectedOpt?.optionTextGu || (selectedOpt ? selectedOpt.optionText : 'અનુત્તરિત'),
        correctOption: correctOpt?.optionText || '',
        correctOptionGu: correctOpt?.optionTextGu || (correctOpt ? correctOpt.optionText : ''),
        isCorrect,
        explanation: q.explanation,
        explanationGu: q.explanationGu || q.explanation,
        stepByStepSolution: enrichWithStepByStepSolution(
          q.id,
          q.questionText,
          session.subject?.name,
          q.topic?.name,
          q.explanation || undefined
        )
      });
    }

    const totalQuestions = answers?.length || 1;
    const remedialPercentage = Math.round((correctCount / totalQuestions) * 100);
    const improvementPercentage = Math.round(remedialPercentage - session.initialPercentage);

    // Warm, positive, supportive encouragement generator
    let encouragementMessage = '';
    let encouragementMessageGu = '';

    if (remedialPercentage >= 80) {
      encouragementMessage = 'Outstanding progress! You have mastered this chapter with great confidence. Keep up the brilliant work!';
      encouragementMessageGu = 'અદ્ભુત પ્રગતિ! તમે સંપૂર્ણ આત્મવિશ્વાસ સાથે આ પ્રકરણ પર પ્રભુત્વ મેળવી લીધું છે. આ જ ઉત્સાહ જાળવી રાખો!';
    } else if (remedialPercentage >= 50) {
      encouragementMessage = 'You are improving! Great job strengthening your understanding. Your hard work is paying off!';
      encouragementMessageGu = 'તમે સુધારો કરી રહ્યા છો! તમારી સમજણને મજબૂત બનાવવા બદલ અભિનંદન. તમારી મહેનત રંગ લાવી રહી છે!';
    } else {
      // Below 50% again: Strictly encouraging and compassionate
      encouragementMessage = "Keep practicing! You are improving with every attempt! Let's try again with another quick concept review.";
      encouragementMessageGu = 'પ્રેક્ટિસ ચાલુ રાખો! તમે દરેક પ્રયાસ સાથે શીખી રહ્યા છો! ચાલો ફરીથી એકવાર શાંતિથી સિદ્ધાંતોનું પુનરાવર્તન કરીને પ્રયાસ કરીએ.';
    }

    const stillWeakTopics = Array.from(stillWeakTopicsMap.values());

    // Update RemedialSession record
    const updatedSession = await prisma.remedialSession.update({
      where: { id: sessionId },
      data: {
        remedialScore: correctCount,
        remedialMaxScore: totalQuestions,
        remedialPercentage,
        improvementPercentage,
        encouragementMessage,
        encouragementMessageGu,
        stillWeakTopics: JSON.stringify(stillWeakTopics),
        timeTakenSeconds,
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    // Save student answers for history
    if (sessionAnswersToCreate.length > 0) {
      await prisma.remedialSessionAnswer.createMany({
        data: sessionAnswersToCreate
      });
    }

    res.json({
      success: true,
      result: {
        sessionId,
        chapterName: session.chapter.name,
        chapterNameGu: session.chapter.nameGu,
        subjectName: session.subject.name,
        subjectNameGu: session.subject.nameGu,
        score: correctCount,
        maxScore: totalQuestions,
        percentage: remedialPercentage,
        initialPercentage: session.initialPercentage,
        improvementPercentage,
        isImproved: improvementPercentage > 0,
        encouragementMessage,
        encouragementMessageGu,
        timeTakenSeconds,
        correctCount,
        wrongCount,
        stillWeakTopics,
        detailedAnswers
      }
    });
  } catch (error: any) {
    console.error('submitRemedialTest error:', error);
    res.status(500).json({ error: 'Failed to submit remedial test' });
  }
};

/**
 * Returns remedial revision history for the logged-in student
 */
export const getRemedialHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const sessions = await prisma.remedialSession.findMany({
      where: {
        userId,
        status: 'COMPLETED'
      },
      include: {
        chapter: true,
        subject: true
      },
      orderBy: { completedAt: 'desc' }
    });

    const totalSessions = sessions.length;
    const improvedSessions = sessions.filter(s => (s.improvementPercentage || 0) > 0).length;
    const avgImprovement = totalSessions > 0
      ? Math.round(sessions.reduce((acc, s) => acc + (s.improvementPercentage || 0), 0) / totalSessions)
      : 0;

    const formattedHistory = sessions.map(s => {
      let weakTopics: any[] = [];
      let stillWeak: any[] = [];
      try {
        if (s.weakTopicsSummary) weakTopics = JSON.parse(s.weakTopicsSummary);
        if (s.stillWeakTopics) stillWeak = JSON.parse(s.stillWeakTopics);
      } catch {}

      return {
        id: s.id,
        subjectName: s.subject.name,
        subjectNameGu: s.subject.nameGu,
        chapterName: s.chapter.name,
        chapterNameGu: s.chapter.nameGu,
        initialPercentage: s.initialPercentage,
        remedialPercentage: s.remedialPercentage,
        improvementPercentage: s.improvementPercentage,
        score: s.remedialScore,
        maxScore: s.remedialMaxScore,
        completedAt: s.completedAt,
        encouragementMessage: s.encouragementMessage,
        encouragementMessageGu: s.encouragementMessageGu,
        weakTopics,
        stillWeakTopics: stillWeak
      };
    });

    res.json({
      success: true,
      stats: {
        totalSessions,
        improvedSessions,
        avgImprovement
      },
      history: formattedHistory
    });
  } catch (error: any) {
    console.error('getRemedialHistory error:', error);
    res.status(500).json({ error: 'Failed to fetch remedial history' });
  }
};

/**
 * Returns active or pending remedial sessions for Dashboard integration
 */
export const getActiveRemedial = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Look for pending or in-progress session
    const active = await prisma.remedialSession.findFirst({
      where: {
        userId,
        status: { in: ['PENDING_REVISION', 'REVISION_COMPLETED', 'TEST_IN_PROGRESS'] }
      },
      include: {
        chapter: true,
        subject: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (active) {
      let weakTopics: any[] = [];
      try {
        if (active.weakTopicsSummary) weakTopics = JSON.parse(active.weakTopicsSummary);
      } catch {}

      const sessionData = {
        id: active.id,
        chapterId: active.chapterId,
        chapterName: active.chapter.name,
        chapterNameGu: active.chapter.nameGu,
        subjectName: active.subject.name,
        subjectNameGu: active.subject.nameGu,
        initialPercentage: active.initialPercentage,
        previousPercentage: active.initialPercentage,
        previousScore: active.initialPercentage,
        status: active.status,
        weakTopics
      };

      return res.json({
        hasActiveRemedial: true,
        session: sessionData,
        activeSession: sessionData
      });
    }

    // If no active, check for the latest completed session in past 7 days to celebrate progress
    const latestCompleted = await prisma.remedialSession.findFirst({
      where: {
        userId,
        status: 'COMPLETED'
      },
      include: {
        chapter: true,
        subject: true
      },
      orderBy: { completedAt: 'desc' }
    });

    res.json({
      hasActiveRemedial: false,
      latestCompleted: latestCompleted ? {
        id: latestCompleted.id,
        chapterName: latestCompleted.chapter.name,
        chapterNameGu: latestCompleted.chapter.nameGu,
        subjectName: latestCompleted.subject.name,
        subjectNameGu: latestCompleted.subject.nameGu,
        initialPercentage: latestCompleted.initialPercentage,
        previousScore: latestCompleted.initialPercentage,
        previousPercentage: latestCompleted.initialPercentage,
        remedialPercentage: latestCompleted.remedialPercentage,
        remedialScore: latestCompleted.remedialPercentage,
        improvementPercentage: latestCompleted.improvementPercentage,
        improvementDelta: latestCompleted.improvementPercentage || 0,
        completedAt: latestCompleted.completedAt
      } : null
    });
  } catch (error: any) {
    console.error('getActiveRemedial error:', error);
    res.status(500).json({ error: 'Failed to fetch active remedial state' });
  }
};
