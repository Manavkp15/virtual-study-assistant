import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../database/prisma';
import { getSafeFilePath, removeUploadedFile } from '../services/fileStorage';
import fs from 'fs';

// ============================================================================
// STUDENT CONTROLLERS
// ============================================================================

/**
 * Get all assigned homework for the authenticated student's academic standard
 */
export const getStudentHomeworks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) return res.status(401).json({ error: 'Unauthorized' });

    const profile = await prisma.studentProfile.findUnique({
      where: { userId: studentId }
    });

    const standard = profile?.standard || 'Standard 8';

    const homeworks = await prisma.homework.findMany({
      where: {
        OR: [
          { standard },
          { standard: 'ALL' }
        ]
      },
      include: {
        subject: true,
        chapter: true,
        topic: true,
        teacher: {
          select: { id: true, name: true, email: true }
        },
        submissions: {
          where: { studentId },
          include: {
            history: {
              orderBy: { version: 'desc' }
            }
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    const now = new Date();

    const formatted = homeworks.map(hw => {
      const submission = hw.submissions[0] || null;
      let calculatedStatus = 'PENDING';

      if (submission) {
        calculatedStatus = submission.status;
      } else if (now > new Date(hw.dueDate)) {
        calculatedStatus = 'LATE';
      }

      return {
        id: hw.id,
        title: hw.title,
        titleGu: hw.titleGu || hw.title,
        instructions: hw.instructions,
        instructionsGu: hw.instructionsGu || hw.instructions,
        standard: hw.standard,
        subjectId: hw.subjectId,
        subjectName: hw.subject.name,
        subjectNameGu: hw.subject.nameGu || hw.subject.name,
        subjectIcon: hw.subject.icon,
        chapterId: hw.chapterId,
        chapterName: hw.chapter?.name || null,
        chapterNameGu: hw.chapter?.nameGu || null,
        topicId: hw.topicId,
        topicName: hw.topic?.name || null,
        topicNameGu: hw.topic?.nameGu || null,
        teacherName: hw.teacher.name,
        assignedDate: hw.assignedDate,
        dueDate: hw.dueDate,
        maxMarks: hw.maxMarks,
        allowResubmission: hw.allowResubmission,
        status: calculatedStatus,
        submission: submission ? {
          id: submission.id,
          status: submission.status,
          originalFileName: submission.originalFileName,
          submittedAt: submission.submittedAt,
          marksObtained: submission.marksObtained,
          teacherFeedback: submission.teacherFeedback,
          evaluatedAt: submission.evaluatedAt,
          submissionVersion: submission.submissionVersion,
          historyCount: submission.history.length
        } : null
      };
    });

    res.json({ homeworks: formatted });
  } catch (error: any) {
    console.error('getStudentHomeworks error:', error);
    res.status(500).json({ error: 'Failed to fetch student homework assignments' });
  }
};

/**
 * Get homework analytics summary for student dashboard
 */
export const getStudentHomeworkSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) return res.status(401).json({ error: 'Unauthorized' });

    const profile = await prisma.studentProfile.findUnique({
      where: { userId: studentId }
    });

    const standard = profile?.standard || 'Standard 8';

    const homeworks = await prisma.homework.findMany({
      where: {
        OR: [
          { standard },
          { standard: 'ALL' }
        ]
      },
      include: {
        subject: true,
        submissions: {
          where: { studentId }
        }
      }
    });

    const now = new Date();
    let totalAssigned = homeworks.length;
    let pending = 0;
    let submitted = 0;
    let late = 0;
    let checked = 0;
    let totalMarksObtained = 0;
    let totalMaxMarks = 0;

    const subjectStatsMap: Record<string, {
      subjectId: string;
      subjectName: string;
      subjectNameGu: string;
      totalAssigned: number;
      completed: number;
      marksObtained: number;
      maxMarks: number;
    }> = {};

    homeworks.forEach(hw => {
      const sub = hw.submissions[0];
      const subKey = hw.subjectId;

      if (!subjectStatsMap[subKey]) {
        subjectStatsMap[subKey] = {
          subjectId: hw.subject.id,
          subjectName: hw.subject.name,
          subjectNameGu: hw.subject.nameGu || hw.subject.name,
          totalAssigned: 0,
          completed: 0,
          marksObtained: 0,
          maxMarks: 0
        };
      }
      subjectStatsMap[subKey].totalAssigned += 1;

      if (!sub) {
        if (now > new Date(hw.dueDate)) {
          late += 1;
        } else {
          pending += 1;
        }
      } else {
        if (sub.status === 'CHECKED') {
          checked += 1;
          if (sub.marksObtained !== null && sub.marksObtained !== undefined) {
            totalMarksObtained += sub.marksObtained;
            totalMaxMarks += hw.maxMarks;
            subjectStatsMap[subKey].marksObtained += sub.marksObtained;
            subjectStatsMap[subKey].maxMarks += hw.maxMarks;
          }
        } else if (sub.status === 'LATE') {
          late += 1;
        } else {
          submitted += 1;
        }
        subjectStatsMap[subKey].completed += 1;
      }
    });

    const averageMarksPercentage = totalMaxMarks > 0
      ? Math.round((totalMarksObtained / totalMaxMarks) * 100)
      : 0;

    const subjectPerformance = Object.values(subjectStatsMap).map(s => {
      const percentage = s.maxMarks > 0
        ? Math.round((s.marksObtained / s.maxMarks) * 100)
        : (s.totalAssigned > 0 ? Math.round((s.completed / s.totalAssigned) * 100) : 0);
      return {
        subjectId: s.subjectId,
        subjectName: s.subjectName,
        subjectNameGu: s.subjectNameGu,
        totalAssigned: s.totalAssigned,
        completed: s.completed,
        percentage
      };
    });

    res.json({
      summary: {
        totalAssigned,
        pending,
        submitted,
        late,
        checked,
        averageMarksPercentage
      },
      subjectPerformance
    });
  } catch (error: any) {
    console.error('getStudentHomeworkSummary error:', error);
    res.status(500).json({ error: 'Failed to fetch homework summary' });
  }
};

/**
 * Get individual homework details
 */
export const getHomeworkById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const isTeacher = req.user?.role === 'ADMIN';

    const homework = await prisma.homework.findUnique({
      where: { id },
      include: {
        subject: true,
        chapter: true,
        topic: true,
        teacher: { select: { id: true, name: true, email: true } },
        submissions: isTeacher
          ? {
              include: {
                student: { select: { id: true, name: true, email: true } },
                history: { orderBy: { version: 'desc' } }
              }
            }
          : {
              where: { studentId: userId },
              include: { history: { orderBy: { version: 'desc' } } }
            }
      }
    });

    if (!homework) {
      return res.status(404).json({ error: 'Homework not found' });
    }

    res.json({ homework });
  } catch (error: any) {
    console.error('getHomeworkById error:', error);
    res.status(500).json({ error: 'Failed to load homework details' });
  }
};

/**
 * Submit homework PDF (drag & drop / browse)
 */
export const submitHomeworkPdf = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) return res.status(401).json({ error: 'Unauthorized' });

    const { id: homeworkId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Please select a valid PDF file to upload' });
    }

    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      include: { subject: true }
    });

    if (!homework) {
      removeUploadedFile(file.filename);
      return res.status(404).json({ error: 'Homework assignment not found' });
    }

    const now = new Date();
    const isLate = now > new Date(homework.dueDate);
    const newStatus = isLate ? 'LATE' : 'SUBMITTED';

    // Check existing submission
    const existingSubmission = await prisma.homeworkSubmission.findUnique({
      where: {
        homeworkId_studentId: {
          homeworkId,
          studentId
        }
      }
    });

    let submission;

    if (existingSubmission) {
      if (!homework.allowResubmission) {
        removeUploadedFile(file.filename);
        return res.status(400).json({ error: 'Re-submission is not allowed for this homework' });
      }

      // Archive previous version to history
      await prisma.homeworkSubmissionHistory.create({
        data: {
          submissionId: existingSubmission.id,
          pdfFilePath: existingSubmission.pdfFilePath,
          originalFileName: existingSubmission.originalFileName,
          fileSizeBytes: existingSubmission.fileSizeBytes,
          submittedAt: existingSubmission.submittedAt || existingSubmission.createdAt,
          version: existingSubmission.submissionVersion,
          marksObtained: existingSubmission.marksObtained,
          teacherFeedback: existingSubmission.teacherFeedback
        }
      });

      // Update active submission, resetting evaluation to avoid inconsistent marks/feedback
      submission = await prisma.homeworkSubmission.update({
        where: { id: existingSubmission.id },
        data: {
          pdfFilePath: file.filename,
          originalFileName: file.originalname,
          fileSizeBytes: file.size,
          mimeType: file.mimetype || 'application/pdf',
          status: newStatus,
          submittedAt: now,
          marksObtained: null,
          teacherFeedback: null,
          evaluatedAt: null,
          evaluatedBy: null,
          submissionVersion: existingSubmission.submissionVersion + 1
        }
      });
    } else {
      submission = await prisma.homeworkSubmission.create({
        data: {
          homeworkId,
          studentId,
          pdfFilePath: file.filename,
          originalFileName: file.originalname,
          fileSizeBytes: file.size,
          mimeType: file.mimetype || 'application/pdf',
          status: newStatus,
          submittedAt: now,
          submissionVersion: 1
        }
      });
    }

    // Send confirmation notification to student
    await prisma.notification.create({
      data: {
        userId: studentId,
        title: 'Homework Submitted Successfully',
        titleGu: 'ગૃહકાર્ય સફળતાપૂર્વક સબમિટ થયું',
        message: `Your homework PDF for "${homework.title}" has been submitted (${isLate ? 'Late' : 'On-time'}).`,
        messageGu: `"${homework.titleGu || homework.title}" માટેનું તમારું ગૃહકાર્ય PDF સફળતાપૂર્વક સબમિટ થયું છે (${isLate ? 'મોડું' : 'સમયસર'}).`,
        type: 'HOMEWORK'
      }
    });

    res.status(200).json({
      message: 'Homework submitted successfully',
      submission
    });
  } catch (error: any) {
    if (req.file) {
      removeUploadedFile(req.file.filename);
    }
    console.error('submitHomeworkPdf error:', error);
    res.status(500).json({ error: error.message || 'Failed to submit homework PDF' });
  }
};

/**
 * Authenticated and secure PDF streaming endpoint
 */
export const streamSubmissionPdf = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const submission = await prisma.homeworkSubmission.findUnique({
      where: { id },
      include: { homework: true }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Strict access control: Student can only view their own submission
    if (userRole === 'STUDENT' && submission.studentId !== userId) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to view this submission' });
    }

    const safePath = getSafeFilePath(submission.pdfFilePath);

    if (!safePath || !fs.existsSync(safePath)) {
      return res.status(404).json({ error: 'PDF file not found on server' });
    }

    const sanitizedDownloadName = submission.originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${sanitizedDownloadName}"`);

    const fileStream = fs.createReadStream(safePath);
    fileStream.pipe(res);
  } catch (error: any) {
    console.error('streamSubmissionPdf error:', error);
    res.status(500).json({ error: 'Failed to retrieve PDF file' });
  }
};

// ============================================================================
// TEACHER / ADMIN CONTROLLERS
// ============================================================================

/**
 * Teacher overview metrics and analytics
 */
export const getTeacherHomeworkOverview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [
      totalHomeworks,
      submissions,
      studentsCount,
      subjects
    ] = await Promise.all([
      prisma.homework.count(),
      prisma.homeworkSubmission.findMany({
        include: { homework: true }
      }),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.subject.findMany({ select: { id: true, name: true, nameGu: true } })
    ]);

    let checkedCount = 0;
    let lateCount = 0;
    let submittedCount = 0;
    let totalMarksAwarded = 0;
    let totalMaxMarks = 0;

    submissions.forEach(sub => {
      if (sub.status === 'CHECKED') {
        checkedCount += 1;
        if (sub.marksObtained !== null && sub.marksObtained !== undefined) {
          totalMarksAwarded += sub.marksObtained;
          totalMaxMarks += sub.homework.maxMarks;
        }
      } else if (sub.status === 'LATE') {
        lateCount += 1;
      } else if (sub.status === 'SUBMITTED') {
        submittedCount += 1;
      }
    });

    const pendingReviews = submittedCount + lateCount;
    const averageClassMarks = totalMaxMarks > 0
      ? Math.round((totalMarksAwarded / totalMaxMarks) * 100)
      : 0;

    const totalPossibleSubmissions = totalHomeworks * Math.max(studentsCount, 1);
    const completionPercentage = totalPossibleSubmissions > 0
      ? Math.round((submissions.length / totalPossibleSubmissions) * 100)
      : 0;

    res.json({
      metrics: {
        totalHomeworks,
        totalSubmissions: submissions.length,
        pendingReviews,
        checkedCount,
        lateCount,
        averageClassMarks,
        completionPercentage
      },
      subjects
    });
  } catch (error: any) {
    console.error('getTeacherHomeworkOverview error:', error);
    res.status(500).json({ error: 'Failed to fetch teacher homework overview' });
  }
};

/**
 * Get filtered submissions list for teachers
 */
export const getTeacherSubmissions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { standard, subjectId, homeworkId, status, search } = req.query;

    const where: any = {};

    if (standard && standard !== 'ALL') {
      where.homework = { standard: String(standard) };
    }

    if (subjectId && subjectId !== 'ALL') {
      where.homework = { ...where.homework, subjectId: String(subjectId) };
    }

    if (homeworkId && homeworkId !== 'ALL') {
      where.homeworkId = String(homeworkId);
    }

    if (status && status !== 'ALL') {
      where.status = String(status);
    }

    if (search) {
      const q = String(search);
      where.OR = [
        { student: { name: { contains: q } } },
        { student: { email: { contains: q } } },
        { homework: { title: { contains: q } } }
      ];
    }

    const submissions = await prisma.homeworkSubmission.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: { select: { standard: true } }
          }
        },
        homework: {
          include: {
            subject: true,
            chapter: true,
            topic: true
          }
        },
        history: { orderBy: { version: 'desc' } }
      },
      orderBy: { submittedAt: 'desc' }
    });

    const formatted = submissions.map(s => ({
      id: s.id,
      homeworkId: s.homeworkId,
      homeworkTitle: s.homework.title,
      homeworkTitleGu: s.homework.titleGu || s.homework.title,
      standard: s.homework.standard,
      subjectName: s.homework.subject.name,
      subjectNameGu: s.homework.subject.nameGu || s.homework.subject.name,
      chapterName: s.homework.chapter?.name || null,
      topicName: s.homework.topic?.name || null,
      maxMarks: s.homework.maxMarks,
      dueDate: s.homework.dueDate,
      studentId: s.student.id,
      studentName: s.student.name,
      studentEmail: s.student.email,
      studentStandard: s.student.profile?.standard || s.homework.standard,
      status: s.status,
      submittedAt: s.submittedAt,
      originalFileName: s.originalFileName,
      fileSizeBytes: s.fileSizeBytes,
      marksObtained: s.marksObtained,
      teacherFeedback: s.teacherFeedback,
      evaluatedAt: s.evaluatedAt,
      submissionVersion: s.submissionVersion,
      pdfUrl: `/api/homework/submissions/${s.id}/pdf`
    }));

    res.json({ submissions: formatted });
  } catch (error: any) {
    console.error('getTeacherSubmissions error:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
};

/**
 * Create new homework assignment
 */
export const createHomework = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teacherId = req.user?.id;
    if (!teacherId) return res.status(401).json({ error: 'Unauthorized' });

    const {
      title,
      titleGu,
      instructions,
      instructionsGu,
      subjectId,
      chapterId,
      topicId,
      standard,
      dueDate,
      maxMarks,
      allowResubmission
    } = req.body;

    if (!title || !subjectId || !dueDate) {
      return res.status(400).json({ error: 'Title, Subject, and Due Date are required' });
    }

    const homework = await prisma.homework.create({
      data: {
        title,
        titleGu: titleGu || title,
        instructions: instructions || '',
        instructionsGu: instructionsGu || instructions || '',
        subjectId,
        chapterId: chapterId || null,
        topicId: topicId || null,
        standard: standard || 'Standard 8',
        teacherId,
        dueDate: new Date(dueDate),
        maxMarks: maxMarks ? Number(maxMarks) : 20.0,
        allowResubmission: allowResubmission !== undefined ? Boolean(allowResubmission) : true
      },
      include: {
        subject: true
      }
    });

    // Notify all enrolled students in this standard
    const targetStudents = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        ...(standard && standard !== 'ALL'
          ? { profile: { standard } }
          : {})
      },
      select: { id: true }
    });

    const formattedDate = new Date(dueDate).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    if (targetStudents.length > 0) {
      await prisma.notification.createMany({
        data: targetStudents.map(student => ({
          userId: student.id,
          title: 'New Homework Assigned',
          titleGu: 'નવું ગૃહકાર્ય સોંપવામાં આવ્યું',
          message: `New homework "${title}" has been assigned for ${homework.subject.name}. Due on ${formattedDate}.`,
          messageGu: `${homework.subject.nameGu || homework.subject.name} માટે નવું ગૃહકાર્ય "${titleGu || title}" સોંપવામાં આવ્યું છે. નિયત તારીખ: ${formattedDate}.`,
          type: 'HOMEWORK'
        }))
      });
    }

    res.status(201).json({
      message: 'Homework created successfully',
      homework
    });
  } catch (error: any) {
    console.error('createHomework error:', error);
    res.status(500).json({ error: error.message || 'Failed to create homework' });
  }
};

/**
 * Update homework assignment
 */
export const updateHomework = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      titleGu,
      instructions,
      instructionsGu,
      subjectId,
      chapterId,
      topicId,
      standard,
      dueDate,
      maxMarks,
      allowResubmission
    } = req.body;

    const updated = await prisma.homework.update({
      where: { id },
      data: {
        title,
        titleGu,
        instructions,
        instructionsGu,
        subjectId,
        chapterId: chapterId || null,
        topicId: topicId || null,
        standard,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        maxMarks: maxMarks ? Number(maxMarks) : undefined,
        allowResubmission: allowResubmission !== undefined ? Boolean(allowResubmission) : undefined
      }
    });

    res.json({
      message: 'Homework updated successfully',
      homework: updated
    });
  } catch (error: any) {
    console.error('updateHomework error:', error);
    res.status(500).json({ error: 'Failed to update homework' });
  }
};

/**
 * Delete homework assignment and associated submission files
 */
export const deleteHomework = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const submissions = await prisma.homeworkSubmission.findMany({
      where: { homeworkId: id },
      select: { pdfFilePath: true }
    });

    submissions.forEach(sub => {
      removeUploadedFile(sub.pdfFilePath);
    });

    await prisma.homework.delete({
      where: { id }
    });

    res.json({ message: 'Homework assignment deleted successfully' });
  } catch (error: any) {
    console.error('deleteHomework error:', error);
    res.status(500).json({ error: 'Failed to delete homework' });
  }
};

/**
 * Teacher evaluates student homework submission
 */
export const evaluateSubmission = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teacherId = req.user?.id;
    if (!teacherId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { marksObtained, teacherFeedback, status } = req.body;

    const submission = await prisma.homeworkSubmission.findUnique({
      where: { id },
      include: {
        homework: { include: { subject: true } },
        student: { select: { id: true, name: true } }
      }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const marksNum = Number(marksObtained);
    if (isNaN(marksNum) || marksNum < 0 || marksNum > submission.homework.maxMarks) {
      return res.status(400).json({
        error: `Marks must be a valid number between 0 and ${submission.homework.maxMarks}`
      });
    }

    const updated = await prisma.homeworkSubmission.update({
      where: { id },
      data: {
        marksObtained: marksNum,
        teacherFeedback: teacherFeedback || '',
        status: status || 'CHECKED',
        evaluatedAt: new Date(),
        evaluatedBy: teacherId
      }
    });

    // Notify student with marks and feedback
    const subName = submission.homework.subject.name;
    const subNameGu = submission.homework.subject.nameGu || subName;
    const maxMarks = submission.homework.maxMarks;

    await prisma.notification.create({
      data: {
        userId: submission.studentId,
        title: 'Homework Checked & Evaluated',
        titleGu: 'ગૃહકાર્ય ચકાસણી પૂર્ણ',
        message: `Your ${subName} homework "${submission.homework.title}" has been checked. Marks: ${marksNum}/${maxMarks}. Teacher Feedback: "${teacherFeedback || 'Good job!'}"`,
        messageGu: `તમારા ${subNameGu} ગૃહકાર્ય "${submission.homework.titleGu || submission.homework.title}" ની ચકાસણી પૂર્ણ થઈ છે. ગુણ: ${marksNum}/${maxMarks}. શિક્ષક પ્રતિસાદ: "${teacherFeedback || 'સરસ પ્રયાસ!'}"`,
        type: 'HOMEWORK'
      }
    });

    res.json({
      message: 'Evaluation saved successfully',
      submission: updated
    });
  } catch (error: any) {
    console.error('evaluateSubmission error:', error);
    res.status(500).json({ error: error.message || 'Failed to evaluate submission' });
  }
};
