import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../database/prisma';
import { updateStudentTopicPerformance } from '../algorithms/weakTopicDetector';

export const getTests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { subjectId, difficulty } = req.query;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const where: any = {};
    if (subjectId) where.subjectId = subjectId as string;
    if (difficulty) where.difficulty = difficulty as string;

    if (userRole === 'STUDENT' && userId) {
      const profile = await prisma.studentProfile.findUnique({ where: { userId } });
      if (profile?.standard) {
        where.subject = { standard: profile.standard };
      }
    }

    const tests = await prisma.test.findMany({
      where,
      include: {
        subject: true,
        _count: {
          select: { testQuestions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ tests });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch test catalog' });
  }
};

export const getTestById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const test = await prisma.test.findUnique({
      where: { id },
      include: {
        subject: true,
        testQuestions: {
          include: {
            question: {
              include: {
                topic: {
                  include: {
                    chapter: true
                  }
                },
                options: {
                  select: {
                    id: true,
                    optionText: true,
                    optionTextGu: true
                    // Do NOT expose isCorrect to frontend during exam!
                  }
                }
              }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!test) return res.status(404).json({ error: 'Test not found' });

    // Format questions cleanly
    const formattedQuestions = test.testQuestions.map(tq => ({
      id: tq.question.id,
      questionText: tq.question.questionText,
      questionTextGu: tq.question.questionTextGu,
      explanation: tq.question.explanation,
      explanationGu: tq.question.explanationGu,
      difficulty: tq.question.difficulty,
      subjectName: test.subject.name,
      subjectNameGu: test.subject.nameGu,
      chapterName: tq.question.topic.chapter.name,
      chapterNameGu: tq.question.topic.chapter.nameGu,
      topicName: tq.question.topic.name,
      topicNameGu: tq.question.topic.nameGu,
      topicId: tq.question.topicId,
      options: tq.question.options
    }));

    res.json({
      test: {
        id: test.id,
        title: test.title,
        titleGu: test.titleGu,
        description: test.description,
        descriptionGu: test.descriptionGu,
        subjectName: test.subject.name,
        subjectNameGu: test.subject.nameGu,
        difficulty: test.difficulty,
        durationMinutes: test.durationMinutes,
        passPercentage: test.passPercentage,
        questions: formattedQuestions
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch test details' });
  }
};

export const submitTest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id: testId } = req.params;
    const { answers, timeTakenSeconds } = req.body;
    // answers is array: [{ questionId: string, selectedOptionId?: string, timeTakenSeconds?: number }]

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        subject: true,
        testQuestions: {
          include: {
            question: {
              include: {
                options: true,
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

    if (!test) return res.status(404).json({ error: 'Test not found' });

    const totalQuestionsCount = test.testQuestions.length;
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    const topicStats = new Map<string, { total: number; correct: number; repeatedMistakes: number }>();

    const studentAnswersToCreate: Array<{
      questionId: string;
      selectedOptionId?: string;
      isCorrect: boolean;
      timeTakenSeconds: number;
    }> = [];

    const mistakesToProcess: Array<{
      questionId: string;
      topicId: string;
      selectedOptionId?: string;
    }> = [];

    // Evaluate each question
    for (const tq of test.testQuestions) {
      const q = tq.question;
      const userAns = answers?.find((a: any) => a.questionId === q.id);

      const topicId = q.topicId;
      const stats = topicStats.get(topicId) || { total: 0, correct: 0, repeatedMistakes: 0 };
      stats.total += 1;

      if (!userAns || !userAns.selectedOptionId) {
        unansweredCount += 1;
        studentAnswersToCreate.push({
          questionId: q.id,
          selectedOptionId: undefined,
          isCorrect: false,
          timeTakenSeconds: userAns?.timeTakenSeconds || 0
        });
      } else {
        const correctOpt = q.options.find(o => o.isCorrect);
        const isCorrect = correctOpt ? correctOpt.id === userAns.selectedOptionId : false;

        if (isCorrect) {
          correctCount += 1;
          stats.correct += 1;
        } else {
          wrongCount += 1;
          mistakesToProcess.push({
            questionId: q.id,
            topicId,
            selectedOptionId: userAns.selectedOptionId
          });
        }

        studentAnswersToCreate.push({
          questionId: q.id,
          selectedOptionId: userAns.selectedOptionId,
          isCorrect,
          timeTakenSeconds: userAns.timeTakenSeconds || 0
        });
      }

      topicStats.set(topicId, stats);
    }

    const score = correctCount;
    const maxScore = totalQuestionsCount;
    const percentage = Math.round((score / (maxScore || 1)) * 1000) / 10;
    const answeredCount = correctCount + wrongCount;
    const accuracy = (answeredCount + unansweredCount) > 0
      ? Math.round((correctCount / (answeredCount + unansweredCount)) * 1000) / 10
      : 0;

    // Create TestAttempt Record in DB
    const attempt = await prisma.testAttempt.create({
      data: {
        userId,
        testId,
        score,
        maxScore,
        percentage,
        accuracy,
        timeTakenSeconds: timeTakenSeconds || 0,
        correctCount,
        wrongCount,
        unansweredCount
      }
    });

    // Save Student Answers
    for (const sa of studentAnswersToCreate) {
      const createdAnswer = await prisma.studentAnswer.create({
        data: {
          attemptId: attempt.id,
          questionId: sa.questionId,
          selectedOptionId: sa.selectedOptionId,
          isCorrect: sa.isCorrect,
          timeTakenSeconds: sa.timeTakenSeconds
        }
      });

      // If wrong, save/update MistakeBookEntry
      if (!sa.isCorrect && sa.selectedOptionId) {
        const targetQ = test.testQuestions.find(tq => tq.questionId === sa.questionId)?.question;
        if (targetQ) {
          const existingMistake = await prisma.mistakeBookEntry.findFirst({
            where: { userId, questionId: sa.questionId }
          });

          if (existingMistake) {
            const updated = await prisma.mistakeBookEntry.update({
              where: { id: existingMistake.id },
              data: {
                incorrectCount: existingMistake.incorrectCount + 1,
                studentAnswerId: createdAnswer.id,
                lastAttemptedAt: new Date(),
                isResolved: false
              }
            });
            // Update repeated mistake count in stats
            const currentTopicStat = topicStats.get(targetQ.topicId);
            if (currentTopicStat) currentTopicStat.repeatedMistakes += 1;
          } else {
            await prisma.mistakeBookEntry.create({
              data: {
                userId,
                questionId: sa.questionId,
                studentAnswerId: createdAnswer.id,
                topicId: targetQ.topicId,
                incorrectCount: 1,
                isResolved: false
              }
            });
          }
        }
      }
    }

    // Update TopicPerformance for each affected topic
    for (const [topicId, stats] of topicStats.entries()) {
      await updateStudentTopicPerformance(userId, topicId, stats.correct, stats.total, stats.repeatedMistakes);
    }

    // Dynamic "What should you study next?" recommendation
    let whatToStudyNext = '';
    let whatToStudyNextGu = '';
    if (accuracy < 50) {
      whatToStudyNext = `Your score is ${percentage}%. Focus on fundamental theory before retaking practice tests. Check your Mistake Book for explanations on missed questions.`;
      whatToStudyNextGu = `તમારો સ્કોર ${percentage}% છે. પ્રેક્ટિસ ટેસ્ટ ફરીથી આપતા પહેલાં મૂળભૂત સિદ્ધાંતો પર ધ્યાન કેન્દ્રિત કરો. ચૂકી ગયેલા પ્રશ્નોની સમજૂતી માટે તમારી ભૂલ પુસ્તક તપાસો.`;
    } else if (accuracy < 75) {
      whatToStudyNext = `Good attempt! You achieved ${percentage}%. Review medium-difficulty questions in topics where accuracy dropped below 60%.`;
      whatToStudyNextGu = `સારો પ્રયાસ! તમે ${percentage}% મેળવ્યા છે. જે વિષયોમાં ચોકસાઈ 60% થી નીચે ગઈ છે તેમાં મધ્યમ-કઠિનતાવાળા પ્રશ્નોનું પુનરાવર્તન કરો.`;
    } else {
      whatToStudyNext = `Excellent performance (${percentage}%)! You have demonstrated strong mastery. Try the next difficulty level or take a full-length challenge test.`;
      whatToStudyNextGu = `ઉત્કૃષ્ટ પ્રદર્શન (${percentage}%)! તમે મજબૂત પકડ દર્શાવી છે. આગામી કઠિનતા સ્તરનો પ્રયાસ કરો અથવા સંપૂર્ણ ચેલેન્જ ટેસ્ટ આપો.`;
    }

    // Return detailed test result evaluation
    const resultDetails = await prisma.testAttempt.findUnique({
      where: { id: attempt.id },
      include: {
        test: { include: { subject: true } },
        studentAnswers: {
          include: {
            question: {
              include: {
                options: true,
                topic: { include: { chapter: true } }
              }
            },
            selectedOption: true
          }
        }
      }
    });

    res.json({
      message: 'Test submitted successfully',
      result: {
        attemptId: attempt.id,
        testTitle: test.title,
        testTitleGu: test.titleGu || test.title,
        subjectName: test.subject.name,
        subjectNameGu: test.subject.nameGu || test.subject.name,
        score,
        maxScore,
        percentage,
        accuracy,
        timeTakenSeconds: timeTakenSeconds || 0,
        correctCount,
        wrongCount,
        unansweredCount,
        whatToStudyNext,
        whatToStudyNextGu,
        detailedAnswers: resultDetails?.studentAnswers.map(sa => {
          const correctOpt = sa.question.options.find(o => o.isCorrect);
          return {
            questionId: sa.questionId,
            questionText: sa.question.questionText,
            questionTextGu: sa.question.questionTextGu || sa.question.questionText,
            topicName: sa.question.topic.name,
            topicNameGu: sa.question.topic.nameGu || sa.question.topic.name,
            selectedOption: sa.selectedOption?.optionText || 'Unanswered',
            selectedOptionGu: sa.selectedOption?.optionTextGu || (sa.selectedOption ? sa.selectedOption.optionText : 'અનુત્તરિત'),
            correctOption: correctOpt?.optionText || '',
            correctOptionGu: correctOpt?.optionTextGu || (correctOpt ? correctOpt.optionText : ''),
            isCorrect: sa.isCorrect,
            explanation: sa.question.explanation,
            explanationGu: sa.question.explanationGu || sa.question.explanation
          };
        })
      }
    });
  } catch (error: any) {
    console.error('submitTest error:', error);
    res.status(500).json({ error: 'Failed to submit test attempt' });
  }
};
