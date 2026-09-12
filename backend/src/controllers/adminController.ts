import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../database/prisma';

export const getAdminOverview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentsCount = await prisma.user.count({ where: { role: 'STUDENT' } });
    const subjectsCount = await prisma.subject.count();
    const questionsCount = await prisma.question.count();
    const testsCount = await prisma.test.count();
    const attemptsCount = await prisma.testAttempt.count();

    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: {
        profile: true,
        _count: {
          select: { attempts: true }
        }
      }
    });

    const recentAttempts = await prisma.testAttempt.findMany({
      include: {
        user: { select: { name: true, email: true } },
        test: { include: { subject: true } }
      },
      orderBy: { completedAt: 'desc' },
      take: 10
    });

    res.json({
      counts: {
        studentsCount,
        subjectsCount,
        questionsCount,
        testsCount,
        attemptsCount
      },
      students: students.map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        standard: s.profile?.standard || 'Standard 8',
        streakCount: s.profile?.streakCount || 0,
        testsAttempted: s._count.attempts,
        createdAt: s.createdAt
      })),
      recentAttempts: recentAttempts.map(ra => ({
        id: ra.id,
        studentName: ra.user.name,
        testTitle: ra.test.title,
        testTitleGu: ra.test.titleGu || ra.test.title,
        subjectName: ra.test.subject.name,
        subjectNameGu: ra.test.subject.nameGu || ra.test.subject.name,
        percentage: ra.percentage,
        completedAt: ra.completedAt
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admin overview' });
  }
};

export const createSubject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, nameGu, code, icon, description, descriptionGu, standard } = req.body;
    if (!name || !code) return res.status(400).json({ error: 'Subject name and code are required' });

    const subject = await prisma.subject.create({
      data: {
        name,
        nameGu: nameGu || name,
        code,
        standard: standard || 'Standard 8',
        icon: icon || 'book',
        description,
        descriptionGu,
        chapters: {
          create: {
            name: 'General Concepts',
            nameGu: 'સામાન્ય ખ્યાલો',
            order: 1,
            topics: {
              create: {
                name: 'Core Topics',
                nameGu: 'મુખ્ય મુદ્દાઓ',
                description: 'Default topic for ' + name,
                descriptionGu: name + ' માટે મૂળભૂત વિષય'
              }
            }
          }
        }
      },
      include: {
        chapters: {
          include: { topics: true }
        }
      }
    });

    res.status(201).json({ message: 'Subject created successfully', subject });
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({ error: 'Failed to create subject' });
  }
};

export const updateSubject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, nameGu, code, standard, description, descriptionGu } = req.body;

    const subject = await prisma.subject.update({
      where: { id },
      data: {
        name,
        nameGu,
        code,
        standard,
        description,
        descriptionGu
      }
    });

    res.json({ message: 'Subject updated successfully', subject });
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({ error: 'Failed to update subject' });
  }
};

export const deleteSubject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.subject.delete({ where: { id } });
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({ error: 'Failed to delete subject' });
  }
};

export const createChapter = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { subjectId, name, nameGu, order } = req.body;
    if (!subjectId || !name) return res.status(400).json({ error: 'SubjectId and chapter name are required' });

    const chapter = await prisma.chapter.create({
      data: { subjectId, name, nameGu: nameGu || name, order: order ? parseInt(order) : 1 }
    });

    res.status(201).json({ message: 'Chapter created successfully', chapter });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create chapter' });
  }
};

export const createTopic = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { chapterId, name, nameGu, description, descriptionGu } = req.body;
    if (!chapterId || !name) return res.status(400).json({ error: 'ChapterId and topic name are required' });

    const topic = await prisma.topic.create({
      data: { chapterId, name, nameGu: nameGu || name, description, descriptionGu }
    });

    res.status(201).json({ message: 'Topic created successfully', topic });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create topic' });
  }
};

export const getQuestions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const questions = await prisma.question.findMany({
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
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ questions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
};

export const addQuestion = async (req: AuthenticatedRequest, res: Response) => {
  try {
    let { topicId, subjectId, questionText, questionTextGu, explanation, explanationGu, difficulty, options } = req.body;

    if (!questionText || !options || options.length < 2) {
      return res.status(400).json({ error: 'Question text and at least 2 options are required' });
    }

    if (!topicId && subjectId) {
      let chapter = await prisma.chapter.findFirst({
        where: { subjectId },
        include: { topics: true }
      });
      if (!chapter) {
        chapter = await prisma.chapter.create({
          data: {
            subjectId,
            name: 'General Concepts',
            nameGu: 'સામાન્ય ખ્યાલો',
            order: 1,
            topics: {
              create: { name: 'Core Topics', nameGu: 'મુખ્ય મુદ્દાઓ', description: 'Default topic', descriptionGu: 'મૂળભૂત વિષય' }
            }
          },
          include: { topics: true }
        });
      }
      if (chapter.topics.length === 0) {
        const topic = await prisma.topic.create({
          data: { chapterId: chapter.id, name: 'Core Topics', nameGu: 'મુખ્ય મુદ્દાઓ', description: 'Default topic', descriptionGu: 'મૂળભૂત વિષય' }
        });
        topicId = topic.id;
      } else {
        topicId = chapter.topics[0].id;
      }
    }

    if (!topicId) {
      return res.status(400).json({ error: 'Please select a Subject or Topic for this question' });
    }

    const question = await prisma.question.create({
      data: {
        topicId,
        questionText,
        questionTextGu: questionTextGu || questionText,
        explanation,
        explanationGu: explanationGu || explanation,
        difficulty: difficulty || 'MEDIUM',
        options: {
          create: options.map((o: any) => ({
            optionText: o.optionText,
            optionTextGu: o.optionTextGu || o.optionText,
            isCorrect: Boolean(o.isCorrect)
          }))
        }
      },
      include: { options: true }
    });

    res.status(201).json({ message: 'Question added successfully', question });
  } catch (error) {
    console.error('Add question error:', error);
    res.status(500).json({ error: 'Failed to add question' });
  }
};

export const updateQuestion = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { questionText, questionTextGu, explanation, explanationGu, difficulty, options, topicId } = req.body;

    await prisma.questionOption.deleteMany({ where: { questionId: id } });

    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: {
        questionText,
        questionTextGu: questionTextGu || questionText,
        explanation,
        explanationGu: explanationGu || explanation,
        difficulty: difficulty || 'MEDIUM',
        ...(topicId ? { topicId } : {}),
        options: {
          create: options.map((o: any) => ({
            optionText: o.optionText,
            optionTextGu: o.optionTextGu || o.optionText,
            isCorrect: Boolean(o.isCorrect)
          }))
        }
      },
      include: { options: true }
    });

    res.json({ message: 'Question updated successfully', question: updatedQuestion });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
};

export const deleteQuestion = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.question.delete({ where: { id } });
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
};

export const createTest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, titleGu, description, descriptionGu, subjectId, difficulty, durationMinutes, questionIds } = req.body;

    if (!title || !subjectId || !questionIds || questionIds.length === 0) {
      return res.status(400).json({ error: 'Title, subjectId, and questionIds are required' });
    }

    const test = await prisma.test.create({
      data: {
        title,
        titleGu: titleGu || title,
        description,
        descriptionGu: descriptionGu || description,
        subjectId,
        difficulty: difficulty || 'MEDIUM',
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : 15,
        testQuestions: {
          create: questionIds.map((qId: string, idx: number) => ({
            questionId: qId,
            order: idx + 1
          }))
        }
      },
      include: { testQuestions: true }
    });

    res.status(201).json({ message: 'Test created successfully', test });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create test' });
  }
};
