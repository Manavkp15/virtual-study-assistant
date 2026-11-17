import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../database/prisma';
import {
  getCanonicalSubjectName,
  ensureSubjectInDatabase,
  isValidTeacherSubject,
  TEACHER_SUBJECTS,
  getTeacherAssignedSubjects
} from '../utils/subjectConstants';

export const getAdminOverview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentsCount = await prisma.user.count({ where: { role: 'STUDENT' } });
    const teachersCount = await prisma.user.count({ where: { role: { in: ['TEACHER', 'ADMIN'] } } });
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

    const teachers = await prisma.user.findMany({
      where: { role: { in: ['TEACHER', 'ADMIN'] } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        teacherSubject: true,
        teachingSubjects: true,
        createdAt: true,
        teacherSubjects: {
          include: { subject: true }
        },
        subjectMappings: {
          include: { subject: true }
        }
      },
      orderBy: { createdAt: 'desc' }
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
        teachersCount,
        subjectsCount,
        questionsCount,
        testsCount,
        attemptsCount
      },
      teachers: teachers.map(t => {
        const tsObjs = (t.teacherSubjects || []).map(ts => ts.subject);
        const smObjs = (t.subjectMappings || []).map(sm => sm.subject);
        const combined = tsObjs.length > 0 ? tsObjs : smObjs;
        let subjectsList = Array.from(new Set(combined.map(s => s.name)));
        if (subjectsList.length === 0 && (t.teacherSubject || t.teachingSubjects)) {
          const raw = t.teachingSubjects || t.teacherSubject || '';
          subjectsList = Array.from(new Set(raw.split(',').map(s => s.trim()).filter(Boolean)));
        }

        return {
          id: t.id,
          name: t.name,
          email: t.email,
          role: t.role,
          subjects: subjectsList,
          subject: subjectsList.join(', ') || 'Not Assigned',
          teacherSubject: subjectsList[0] || t.teacherSubject || 'Not Assigned',
          teachingSubjects: subjectsList.join(', ') || t.teachingSubjects,
          teacherSubjects: combined,
          status: 'Active',
          createdAt: t.createdAt
        };
      }),
      students: students.map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        mobileNumber: s.mobileNumber || s.profile?.mobileNumber || '',
        rollNumber: s.profile?.rollNumber || '',
        udiseCode: s.profile?.udiseCode || '',
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

export const deleteStudent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const student = await prisma.user.findUnique({
      where: { id },
      include: { profile: true }
    });

    if (!student || student.role !== 'STUDENT') {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Delete student activity data
    await prisma.homeworkSubmissionHistory.deleteMany({
      where: { submission: { studentId: id } }
    });
    await prisma.homeworkSubmission.deleteMany({ where: { studentId: id } });
    await prisma.studyMaterialAccess.deleteMany({ where: { studentId: id } });
    await prisma.studentAnswer.deleteMany({ where: { attempt: { userId: id } } });
    await prisma.testAttempt.deleteMany({ where: { userId: id } });
    await prisma.mistakeBookEntry.deleteMany({ where: { userId: id } });
    await prisma.topicPerformance.deleteMany({ where: { userId: id } });
    await prisma.studyTask.deleteMany({ where: { plan: { userId: id } } });
    await prisma.studyPlan.deleteMany({ where: { userId: id } });
    await prisma.notification.deleteMany({ where: { userId: id } });
    await prisma.achievement.deleteMany({ where: { userId: id } });

    if (student.profile) {
      await prisma.studentProfile.delete({ where: { userId: id } });
    }

    await prisma.user.delete({ where: { id } });

    res.json({ message: `Student ${student.name} and all profile data deleted successfully` });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
};

export const clearStudentProfiles = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { standard } = req.query; // optional: e.g. 'Standard 6', 'Standard 7', 'Standard 8', or 'ALL'

    let studentUsers;
    if (standard && standard !== 'ALL') {
      studentUsers = await prisma.user.findMany({
        where: {
          role: 'STUDENT',
          profile: { standard: String(standard) }
        },
        select: { id: true }
      });
    } else {
      studentUsers = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: { id: true }
      });
    }

    const studentIds = studentUsers.map(s => s.id);

    if (studentIds.length === 0) {
      return res.json({ message: 'No student profiles found to clear', count: 0 });
    }

    // Delete associated student activity
    await prisma.homeworkSubmissionHistory.deleteMany({
      where: { submission: { studentId: { in: studentIds } } }
    });
    await prisma.homeworkSubmission.deleteMany({
      where: { studentId: { in: studentIds } }
    });
    await prisma.studyMaterialAccess.deleteMany({
      where: { studentId: { in: studentIds } }
    });
    await prisma.studentAnswer.deleteMany({
      where: { attempt: { userId: { in: studentIds } } }
    });
    await prisma.testAttempt.deleteMany({
      where: { userId: { in: studentIds } }
    });
    await prisma.mistakeBookEntry.deleteMany({
      where: { userId: { in: studentIds } }
    });
    await prisma.topicPerformance.deleteMany({
      where: { userId: { in: studentIds } }
    });
    await prisma.studyTask.deleteMany({
      where: { plan: { userId: { in: studentIds } } }
    });
    await prisma.studyPlan.deleteMany({
      where: { userId: { in: studentIds } }
    });
    await prisma.notification.deleteMany({
      where: { userId: { in: studentIds } }
    });
    await prisma.achievement.deleteMany({
      where: { userId: { in: studentIds } }
    });

    await prisma.studentProfile.deleteMany({
      where: { userId: { in: studentIds } }
    });

    const deleted = await prisma.user.deleteMany({
      where: { id: { in: studentIds } }
    });

    res.json({
      message: `Successfully cleared ${deleted.count} student profiles and user credentials${standard && standard !== 'ALL' ? ` for ${standard}` : ' across all standards'}`,
      count: deleted.count
    });
  } catch (error) {
    console.error('Clear students error:', error);
    res.status(500).json({ error: 'Failed to clear student profiles' });
  }
};

export const getTeachers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teachers = await prisma.user.findMany({
      where: { role: { in: ['TEACHER', 'ADMIN'] } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        teacherSubject: true,
        teachingSubjects: true,
        createdAt: true,
        teacherSubjects: {
          include: { subject: true }
        },
        subjectMappings: {
          include: { subject: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      teachers: teachers.map(t => {
        const tsObjs = (t.teacherSubjects || []).map(ts => ts.subject);
        const smObjs = (t.subjectMappings || []).map(sm => sm.subject);
        const combined = tsObjs.length > 0 ? tsObjs : smObjs;
        let subjectsList = Array.from(new Set(combined.map(s => s.name)));
        if (subjectsList.length === 0 && (t.teacherSubject || t.teachingSubjects)) {
          const raw = t.teachingSubjects || t.teacherSubject || '';
          subjectsList = Array.from(new Set(raw.split(',').map(s => s.trim()).filter(Boolean)));
        }

        return {
          id: t.id,
          name: t.name,
          email: t.email,
          role: t.role,
          subjects: subjectsList,
          subject: subjectsList.join(', ') || 'Not Assigned',
          teacherSubject: subjectsList[0] || t.teacherSubject || 'Not Assigned',
          teachingSubjects: subjectsList.join(', ') || t.teachingSubjects,
          teacherSubjects: combined,
          status: 'Active',
          createdAt: t.createdAt
        };
      })
    });
  } catch (error) {
    console.error('getTeachers error:', error);
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
};

export const updateTeacherSubject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { subject, subjects, subjectIds } = req.body;

    const rawList = subjects !== undefined ? subjects : subjectIds !== undefined ? subjectIds : subject;

    let requestedList: string[] = [];
    if (Array.isArray(rawList)) {
      requestedList = rawList.map(s => String(s).trim()).filter(Boolean);
    } else if (typeof rawList === 'string' && rawList.trim()) {
      requestedList = rawList.split(',').map(s => s.trim()).filter(Boolean);
    }

    if (requestedList.length === 0) {
      return res.status(400).json({
        error: 'Please select at least one subject.',
        messageGu: 'કૃપા કરીને ઓછામાં ઓછો એક વિષય પસંદ કરો.'
      });
    }

    const teacher = await prisma.user.findUnique({
      where: { id }
    });

    if (!teacher || (teacher.role !== 'TEACHER' && teacher.role !== 'ADMIN')) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Resolve canonical subjects
    const canonicalNames: string[] = [];
    const validSubjectIds: string[] = [];

    for (const item of requestedList) {
      const matchedById = await prisma.subject.findUnique({ where: { id: item } });
      if (matchedById) {
        if (!isValidTeacherSubject(matchedById.name)) {
          return res.status(400).json({
            error: `Invalid subject: "${matchedById.name}". Allowed subjects are: ${TEACHER_SUBJECTS.map(s => s.name).join(', ')}`,
            messageGu: 'અમાન્ય વિષય પસંદ કર્યો છે.'
          });
        }
        canonicalNames.push(getCanonicalSubjectName(matchedById.name));
        validSubjectIds.push(matchedById.id);
      } else {
        if (!isValidTeacherSubject(item)) {
          return res.status(400).json({
            error: `Invalid subject: "${item}". Allowed subjects are: ${TEACHER_SUBJECTS.map(s => s.name).join(', ')}`,
            messageGu: 'અમાન્ય વિષય પસંદ કર્યો છે.'
          });
        }
        const cName = getCanonicalSubjectName(item);
        canonicalNames.push(cName);
        const sub = await ensureSubjectInDatabase(prisma, cName);
        if (sub) validSubjectIds.push(sub.id);
      }
    }

    const uniqueNames = Array.from(new Set(canonicalNames));
    const uniqueIds = Array.from(new Set(validSubjectIds));

    const updated = await prisma.user.update({
      where: { id },
      data: {
        teacherSubject: uniqueNames[0] || null,
        teachingSubjects: uniqueNames.join(', ')
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        teacherSubject: true,
        teachingSubjects: true
      }
    });

    // Sync TeacherSubject table
    await prisma.teacherSubject.deleteMany({ where: { teacherId: id } });
    for (const sid of uniqueIds) {
      await prisma.teacherSubject.create({
        data: { teacherId: id, subjectId: sid }
      });
    }

    // Sync TeacherSubjectMapping table
    await prisma.teacherSubjectMapping.deleteMany({ where: { teacherId: id } });
    for (const sid of uniqueIds) {
      await prisma.teacherSubjectMapping.create({
        data: { teacherId: id, subjectId: sid }
      });
    }

    res.json({
      message: 'Teacher subjects updated successfully',
      subjects: uniqueNames,
      teacher: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        subject: uniqueNames.join(', '),
        subjects: uniqueNames,
        teacherSubject: uniqueNames[0],
        teachingSubjects: uniqueNames.join(', '),
        status: 'Active'
      }
    });
  } catch (error) {
    console.error('updateTeacherSubject error:', error);
    res.status(500).json({ error: 'Failed to update teacher subject' });
  }
};

