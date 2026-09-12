import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../database/prisma';

export const getMistakes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { subjectId, topicId, isResolved } = req.query;

    const where: any = { userId };
    if (isResolved !== undefined) where.isResolved = isResolved === 'true';

    const mistakes = await prisma.mistakeBookEntry.findMany({
      where,
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
        },
        studentAnswer: {
          include: {
            selectedOption: true
          }
        }
      },
      orderBy: [{ incorrectCount: 'desc' }, { lastAttemptedAt: 'desc' }]
    });

    const formattedMistakes = mistakes.map(m => {
      const q = m.question;
      const correctOpt = q.options.find(o => o.isCorrect);

      let recommendation = 'Review this concept before attempting another test.';
      let recommendationGu = 'બીજો ટેસ્ટ આપતા પહેલાં આ ખ્યાલનું પુનરાવર્તન કરો.';
      if (m.incorrectCount >= 3) {
        recommendation = `⚠️ REPEATED MISTAKE (${m.incorrectCount}x): Review this concept before attempting another test. Thoroughly review ${q.topic.name} identities.`;
        recommendationGu = `⚠️ વારંવાર થયેલી ભૂલ (${m.incorrectCount} વખત): બીજો ટેસ્ટ આપતા પહેલાં આ ખ્યાલનું પુનરાવર્તન કરો. ${q.topic.nameGu || q.topic.name} ના સૂત્રોનો સંપૂર્ણ અભ્યાસ કરો.`;
      } else if (m.incorrectCount === 2) {
        recommendation = `Warning: You answered this question incorrectly 2 times. Double-check calculations and formula substitution.`;
        recommendationGu = `ચેતવણી: તમે આ પ્રશ્નનો 2 વખત ખોટો જવાબ આપ્યો છે. ગણતરીઓ અને સૂત્રોની કિંમતો બે વાર તપાસો.`;
      }

      return {
        id: m.id,
        questionId: q.id,
        questionText: q.questionText,
        questionTextGu: q.questionTextGu || q.questionText,
        explanation: q.explanation,
        explanationGu: q.explanationGu || q.explanation,
        difficulty: q.difficulty,
        subjectName: q.topic.chapter.subject.name,
        subjectNameGu: q.topic.chapter.subject.nameGu || q.topic.chapter.subject.name,
        chapterName: q.topic.chapter.name,
        chapterNameGu: q.topic.chapter.nameGu || q.topic.chapter.name,
        topicName: q.topic.name,
        topicNameGu: q.topic.nameGu || q.topic.name,
        studentAnswer: m.studentAnswer?.selectedOption?.optionText || 'Unanswered',
        studentAnswerGu: m.studentAnswer?.selectedOption?.optionTextGu || (m.studentAnswer?.selectedOption ? m.studentAnswer.selectedOption.optionText : 'અનુત્તરિત'),
        correctAnswer: correctOpt?.optionText || '',
        correctAnswerGu: correctOpt?.optionTextGu || (correctOpt ? correctOpt.optionText : ''),
        incorrectCount: m.incorrectCount,
        isRepeatedMistake: m.incorrectCount >= 2,
        isResolved: m.isResolved,
        recommendation,
        recommendationGu,
        lastAttemptedAt: m.lastAttemptedAt
      };
    });

    res.json({ mistakes: formattedMistakes });
  } catch (error: any) {
    console.error('getMistakes error:', error);
    res.status(500).json({ error: 'Failed to fetch mistake book' });
  }
};

export const resolveMistake = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;

    const mistake = await prisma.mistakeBookEntry.findFirst({
      where: { id, userId }
    });

    if (!mistake) return res.status(404).json({ error: 'Mistake record not found' });

    const updated = await prisma.mistakeBookEntry.update({
      where: { id },
      data: { isResolved: !mistake.isResolved }
    });

    res.json({ message: 'Mistake status updated successfully', mistake: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update mistake record' });
  }
};
