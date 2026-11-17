import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../database/prisma';
import { getSafeFilePath, removeUploadedFile, HOMEWORK_UPLOAD_DIR, persistFile, ensureFileOnDisk, deletePersistedFile } from '../services/fileStorage';
import { processSubmissionFiles } from '../ai/ocrVisionService';
import { evaluateHomeworkSubmission, QuestionInput } from '../ai/homeworkGradingEngine';
import path from 'path';
import fs from 'fs';
import { getTeacherAssignedSubjects } from '../utils/subjectConstants';

// ============================================================================
// STUDENT CONTROLLERS
// ============================================================================

/**
 * Get all assigned homework for the authenticated student's academic standard and division
 */
export const getStudentHomeworks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) return res.status(401).json({ error: 'Unauthorized' });

    const profile = await prisma.studentProfile.findUnique({
      where: { userId: studentId }
    });

    const standard = profile?.standard || 'Standard 8';
    const division = profile?.division || 'A';

    const homeworks = await prisma.homework.findMany({
      where: {
        AND: [
          {
            OR: [
              { standard },
              { standard: 'ALL' }
            ]
          },
          {
            OR: [
              { division: 'ALL' },
              { division },
              { division: null as any }
            ]
          }
        ]
      },
      include: {
        subject: true,
        chapter: true,
        topic: true,
        questions: {
          orderBy: { questionNumber: 'asc' },
          select: { id: true, questionNumber: true, questionText: true, maxMarks: true }
        },
        teacher: {
          select: { id: true, name: true, email: true }
        },
        submissions: {
          where: { studentId },
          include: {
            evaluations: {
              orderBy: { questionNumber: 'asc' }
            },
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
        division: hw.division,
        language: hw.language,
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
        totalQuestions: hw.questions.length,
        questions: hw.questions,
        allowResubmission: hw.allowResubmission,
        status: calculatedStatus,
        submission: submission ? {
          id: submission.id,
          status: submission.status,
          reviewStatus: submission.reviewStatus,
          originalFileName: submission.originalFileName,
          submittedAt: submission.submittedAt,
          marksObtained: submission.marksObtained,
          aiScore: submission.aiScore,
          aiConfidence: submission.aiConfidence,
          isTeacherApproved: submission.isTeacherApproved,
          teacherComment: submission.teacherComment,
          teacherFeedback: submission.teacherFeedback,
          evaluatedAt: submission.evaluatedAt,
          submissionVersion: submission.submissionVersion,
          historyCount: submission.history.length,
          evaluations: submission.evaluations
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

    const subjectStatsMap: Record<string, any> = {};

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
        if (sub.isTeacherApproved || sub.status === 'CHECKED') {
          checked += 1;
          const score = sub.marksObtained !== null ? sub.marksObtained : (sub.aiScore || 0);
          totalMarksObtained += score;
          totalMaxMarks += hw.maxMarks;
          subjectStatsMap[subKey].marksObtained += score;
          subjectStatsMap[subKey].maxMarks += hw.maxMarks;
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

    const subjectPerformance = Object.values(subjectStatsMap).map((s: any) => {
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
 * Get individual homework details with questions, rubrics, and existing submission
 */
export const getHomeworkById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const isTeacher = req.user?.role === 'ADMIN' || req.user?.role === 'TEACHER';

    const homework = await prisma.homework.findUnique({
      where: { id },
      include: {
        subject: true,
        chapter: true,
        topic: true,
        questions: {
          orderBy: { questionNumber: 'asc' }
        },
        teacher: { select: { id: true, name: true, email: true } },
        submissions: isTeacher
          ? {
              include: {
                student: { select: { id: true, name: true, email: true } },
                pages: { orderBy: { pageNumber: 'asc' } },
                evaluations: { orderBy: { questionNumber: 'asc' } },
                history: { orderBy: { version: 'desc' } }
              }
            }
          : {
              where: { studentId: userId },
              include: {
                pages: { orderBy: { pageNumber: 'asc' } },
                evaluations: { orderBy: { questionNumber: 'asc' } },
                history: { orderBy: { version: 'desc' } }
              }
            }
      }
    });

    if (!homework) {
      return res.status(404).json({ error: 'Homework assignment not found' });
    }

    res.json({ homework });
  } catch (error: any) {
    console.error('getHomeworkById error:', error);
    res.status(500).json({ error: 'Failed to load homework details' });
  }
};

/**
 * Submit handwritten homework (JPG, PNG, PDF, multiple pages)
 * Runs automated OCR, Question Extraction & AI Grading Pipeline
 */
export const submitStudentHomework = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) return res.status(401).json({ error: 'Unauthorized' });

    const { id: homeworkId } = req.params;

    // Collect uploaded files (either req.files or req.file)
    let uploadedFiles: Express.Multer.File[] = [];
    if (req.files) {
      if (Array.isArray(req.files)) {
        uploadedFiles = req.files;
      } else {
        const fileMap = req.files as { [fieldname: string]: Express.Multer.File[] };
        if (fileMap['file']) uploadedFiles.push(...fileMap['file']);
        if (fileMap['files']) uploadedFiles.push(...fileMap['files']);
        if (fileMap['pages']) uploadedFiles.push(...fileMap['pages']);
      }
    } else if (req.file) {
      uploadedFiles = [req.file];
    }

    if (uploadedFiles.length === 0) {
      return res.status(400).json({ error: 'Please upload at least one image or PDF file of your homework.' });
    }

    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      include: {
        subject: true,
        questions: { orderBy: { questionNumber: 'asc' } },
        teacher: { select: { id: true, name: true, email: true } }
      }
    });

    if (!homework) {
      uploadedFiles.forEach(f => removeUploadedFile(f.filename));
      return res.status(404).json({ error: 'Homework assignment not found' });
    }

    const now = new Date();
    const isLate = now > new Date(homework.dueDate);
    const newStatus = isLate ? 'LATE' : 'SUBMITTED';

    // Primary file is the first file uploaded
    const primaryFile = uploadedFiles[0];
    const totalSizeBytes = uploadedFiles.reduce((acc, f) => acc + f.size, 0);

    // Check existing submission
    const existingSubmission = await prisma.homeworkSubmission.findUnique({
      where: {
        homeworkId_studentId: {
          homeworkId,
          studentId
        }
      },
      include: { pages: true, evaluations: true }
    });

    let submission: any;

    if (existingSubmission) {
      if (!homework.allowResubmission) {
        uploadedFiles.forEach(f => removeUploadedFile(f.filename));
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

      // Clear previous pages and evaluations for fresh AI evaluation
      await prisma.submissionPage.deleteMany({ where: { submissionId: existingSubmission.id } });
      await prisma.questionEvaluation.deleteMany({ where: { submissionId: existingSubmission.id } });

      submission = await prisma.homeworkSubmission.update({
        where: { id: existingSubmission.id },
        data: {
          pdfFilePath: primaryFile.filename,
          originalFileName: primaryFile.originalname,
          fileSizeBytes: totalSizeBytes,
          mimeType: primaryFile.mimetype || 'image/jpeg',
          status: newStatus,
          reviewStatus: 'PENDING_AI',
          submittedAt: now,
          marksObtained: null,
          aiScore: null,
          aiFeedback: null,
          aiConfidence: null,
          isTeacherApproved: false,
          teacherApprovedAt: null,
          teacherComment: null,
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
          pdfFilePath: primaryFile.filename,
          originalFileName: primaryFile.originalname,
          fileSizeBytes: totalSizeBytes,
          mimeType: primaryFile.mimetype || 'image/jpeg',
          status: newStatus,
          reviewStatus: 'PENDING_AI',
          submittedAt: now,
          submissionVersion: 1
        }
      });
    }

    // Save individual uploaded pages
    const filePathsOnDisk: string[] = [];
    await persistFile(primaryFile.path, primaryFile.filename, primaryFile.mimetype, primaryFile.originalname);
    for (let i = 0; i < uploadedFiles.length; i++) {
      const f = uploadedFiles[i];
      const pagePath = path.join(HOMEWORK_UPLOAD_DIR, f.filename);
      filePathsOnDisk.push(pagePath);
      await persistFile(f.path, f.filename, f.mimetype, f.originalname);

      await prisma.submissionPage.create({
        data: {
          submissionId: submission.id,
          pageNumber: i + 1,
          imagePath: f.filename,
          originalName: f.originalname
        }
      });
    }

    // ========================================================================
    // AI CHECKING PIPELINE
    // ========================================================================
    try {
      // 1. OCR / Vision Processing
      const ocrResult = await processSubmissionFiles(filePathsOnDisk, homework.language || 'en');

      // Update OCR text in pages
      for (const page of ocrResult.pages) {
        await prisma.submissionPage.updateMany({
          where: {
            submissionId: submission.id,
            pageNumber: page.pageNumber
          },
          data: {
            ocrText: page.rawText
          }
        });
      }

      // 2. Format Questions for Grading Engine
      const questionsForGrading: QuestionInput[] = (homework.questions || []).map(q => {
        let parsedRubric = null;
        let parsedKeywords = null;
        let parsedAlternatives = null;

        try {
          if (q.rubricJson) parsedRubric = JSON.parse(q.rubricJson);
          if (q.keywordsJson) parsedKeywords = JSON.parse(q.keywordsJson);
          if (q.alternativeAnswers) parsedAlternatives = JSON.parse(q.alternativeAnswers);
        } catch (e) {
          // ignore
        }

        return {
          id: q.id,
          questionNumber: q.questionNumber,
          questionText: q.questionText,
          questionTextGu: q.questionTextGu,
          maxMarks: q.maxMarks,
          modelAnswer: q.modelAnswer,
          modelAnswerGu: q.modelAnswerGu,
          alternativeAnswers: parsedAlternatives,
          rubric: parsedRubric,
          keywords: parsedKeywords
        };
      });

      // If no questions defined yet, generate a default question from homework instructions
      if (questionsForGrading.length === 0) {
        questionsForGrading.push({
          questionNumber: 1,
          questionText: homework.title,
          maxMarks: homework.maxMarks || 10,
          modelAnswer: homework.instructions || 'Model answer based on curriculum requirements.',
          rubric: [
            { criterion: 'Core conceptual clarity and complete answer', marks: homework.maxMarks || 10 }
          ]
        });
      }

      // 3. Evaluate Homework with Grading Engine
      const evaluation = await evaluateHomeworkSubmission(
        questionsForGrading,
        ocrResult,
        homework.language || 'en'
      );

      // 4. Save per-question evaluations to Database
      for (const qRes of evaluation.questions) {
        const matchedQuestion = homework.questions.find(q => q.questionNumber === qRes.questionNumber);

        await prisma.questionEvaluation.create({
          data: {
            submissionId: submission.id,
            questionId: matchedQuestion?.id || null,
            questionNumber: qRes.questionNumber,
            studentAnswerText: qRes.studentAnswerText,
            aiMarks: qRes.aiMarks,
            teacherMarks: null,
            maxMarks: qRes.maxMarks,
            status: qRes.status,
            confidenceScore: qRes.confidenceScore,
            confidenceLevel: qRes.confidenceLevel,
            needsTeacherReview: qRes.needsTeacherReview,
            rubricBreakdownJson: JSON.stringify(qRes.rubricBreakdown),
            missingPointsJson: JSON.stringify(qRes.missingPoints),
            incorrectStatementsJson: JSON.stringify(qRes.incorrectStatements),
            aiFeedback: qRes.aiFeedback
          }
        });
      }

      // 5. Update submission with AI results
      // AI result does NOT immediately become final - status is 'PENDING_TEACHER_REVIEW'
      submission = await prisma.homeworkSubmission.update({
        where: { id: submission.id },
        data: {
          aiScore: evaluation.aiScore,
          aiFeedback: evaluation.overallFeedback,
          aiConfidence: evaluation.aiConfidence,
          reviewStatus: 'PENDING_TEACHER_REVIEW',
          status: newStatus
        },
        include: {
          pages: { orderBy: { pageNumber: 'asc' } },
          evaluations: { orderBy: { questionNumber: 'asc' } }
        }
      });

      // 6. Log AI evaluation to Audit Log
      await prisma.homeworkAuditLog.create({
        data: {
          submissionId: submission.id,
          action: 'AI_EVALUATED',
          actorName: 'AI Homework Checker',
          actorRole: 'SYSTEM',
          newData: JSON.stringify({
            aiScore: evaluation.aiScore,
            maxScore: evaluation.maxScore,
            confidence: evaluation.aiConfidence,
            totalQuestions: evaluation.totalQuestions
          }),
          notes: 'Automated handwriting extraction & rubric checking complete.'
        }
      });

      // 7. Notify Teacher about new submission and AI check
      await prisma.notification.create({
        data: {
          userId: homework.teacherId,
          title: 'New Homework Submission Ready for Review',
          titleGu: 'નવું ગૃહકાર્ય સબમિશન ચકાસણી માટે તૈયાર',
          message: `${req.user?.name || 'A student'} submitted homework for "${homework.title}". AI preliminary score: ${evaluation.aiScore}/${evaluation.maxScore} (${evaluation.aiConfidence} Confidence).`,
          messageGu: `${req.user?.name || 'વિદ્યાર્થી'} દ્વારા "${homework.titleGu || homework.title}" માટે ગૃહકાર્ય સબમિટ કર્યું. AI ગુણ: ${evaluation.aiScore}/${evaluation.maxScore}.`,
          type: 'HOMEWORK'
        }
      });
    } catch (aiErr: any) {
      console.warn('[AI Checking Error] Fallback to pending manual review:', aiErr.message);
      await prisma.homeworkSubmission.update({
        where: { id: submission.id },
        data: { reviewStatus: 'PENDING_TEACHER_REVIEW' }
      });
    }

    // Confirmation notification to Student
    await prisma.notification.create({
      data: {
        userId: studentId,
        title: 'Your homework has been submitted successfully.',
        titleGu: 'તમારું ગૃહકાર્ય સફળતાપૂર્વક સબમિટ થયું છે.',
        message: `Your homework for "${homework.title}" was submitted. AI checking is complete and pending teacher review.`,
        messageGu: `"${homework.titleGu || homework.title}" માટેનું તમારું ગૃહકાર્ય સબમિટ થયું છે. AI ચકાસણી પૂર્ણ થઈ છે અને શિક્ષકની મંજૂરી માટે પેન્ડિંગ છે.`,
        type: 'HOMEWORK'
      }
    });

    res.status(200).json({
      message: 'Your homework has been submitted successfully.',
      submission
    });
  } catch (error: any) {
    console.error('submitStudentHomework error:', error);
    res.status(500).json({ error: error.message || 'Failed to submit homework' });
  }
};

/**
 * Get detailed submission result with question-by-question rubric, AI marks, and teacher approval
 */
export const getSubmissionDetails = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const submission = await prisma.homeworkSubmission.findUnique({
      where: { id },
      include: {
        homework: {
          include: {
            subject: true,
            chapter: true,
            topic: true,
            questions: { orderBy: { questionNumber: 'asc' } },
            teacher: { select: { id: true, name: true, email: true } }
          }
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: true
          }
        },
        pages: { orderBy: { pageNumber: 'asc' } },
        evaluations: {
          orderBy: { questionNumber: 'asc' },
          include: {
            question: true
          }
        },
        auditLogs: { orderBy: { createdAt: 'desc' } },
        history: { orderBy: { version: 'desc' } }
      }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Role-based authorization
    if (userRole === 'STUDENT' && submission.studentId !== userId) {
      return res.status(403).json({ error: 'Forbidden: You can only view your own submission' });
    }

    // Parse JSON fields in evaluations for clean frontend consumption
    const parsedEvaluations = submission.evaluations.map(ev => {
      let rubricBreakdown = [];
      let missingPoints = [];
      let incorrectStatements = [];

      try {
        if (ev.rubricBreakdownJson) rubricBreakdown = JSON.parse(ev.rubricBreakdownJson);
        if (ev.missingPointsJson) missingPoints = JSON.parse(ev.missingPointsJson);
        if (ev.incorrectStatementsJson) incorrectStatements = JSON.parse(ev.incorrectStatementsJson);
      } catch (e) {
        // ignore
      }

      return {
        ...ev,
        rubricBreakdown,
        missingPoints,
        incorrectStatements
      };
    });

    res.json({
      submission: {
        ...submission,
        evaluations: parsedEvaluations
      }
    });
  } catch (error: any) {
    console.error('getSubmissionDetails error:', error);
    res.status(500).json({ error: 'Failed to fetch submission details' });
  }
};

/**
 * Stream submission page file (JPG, PNG, PDF) securely
 */
export const streamSubmissionPageFile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, pageId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const submission = await prisma.homeworkSubmission.findUnique({
      where: { id },
      include: { pages: true }
    });

    if (!submission) return res.status(404).json({ error: 'Submission not found' });

    if (userRole === 'STUDENT' && submission.studentId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    let targetFilename = submission.pdfFilePath;
    let originalName = submission.originalFileName;

    if (pageId && pageId !== 'primary') {
      const matchedPage = submission.pages.find(p => p.id === pageId || String(p.pageNumber) === pageId);
      if (matchedPage) {
        targetFilename = matchedPage.imagePath;
        originalName = matchedPage.originalName || matchedPage.imagePath;
      }
    }

    const safePath = (await ensureFileOnDisk(targetFilename, HOMEWORK_UPLOAD_DIR)) || getSafeFilePath(targetFilename);
    if (!safePath || !fs.existsSync(safePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType =
      ext === '.pdf'
        ? 'application/pdf'
        : ext === '.png'
        ? 'image/png'
        : ext === '.webp'
        ? 'image/webp'
        : 'image/jpeg';

    const sanitizedDownloadName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${sanitizedDownloadName}"`);

    const fileStream = fs.createReadStream(safePath);
    fileStream.pipe(res);
  } catch (error: any) {
    console.error('streamSubmissionPageFile error:', error);
    res.status(500).json({ error: 'Failed to retrieve submission page file' });
  }
};

// ============================================================================
// TEACHER / ADMIN CONTROLLERS
// ============================================================================

/**
 * Create a new Homework with dynamic Questions, Rubrics & Model Answers
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
      standard,
      division,
      language,
      subjectId,
      chapterId,
      topicId,
      dueDate,
      maxMarks,
      allowResubmission,
      questions
    } = req.body;

    // REQUIREMENT: Enforce backend verification so teachers can only create homework for their assigned subjects
    let targetSubjectId = subjectId;
    if (req.user?.role === 'TEACHER') {
      const assignedSubjects = await getTeacherAssignedSubjects(prisma, teacherId);
      if (assignedSubjects.length === 0) {
        return res.status(403).json({
          error: 'You do not have any assigned subjects to create homework.',
          messageGu: 'ગૃહકાર્ય બનાવવા માટે તમારી પાસે કોઈ વિષય ફાળવેલ નથી.'
        });
      }

      const assignedSubjectIds = assignedSubjects.map(s => s.id);

      if (targetSubjectId) {
        if (!assignedSubjectIds.includes(targetSubjectId)) {
          return res.status(403).json({
            error: 'You are not authorized to create homework for this subject.',
            messageGu: 'તમને આ વિષય માટે ગૃહકાર્ય બનાવવાની મંજૂરી નથી.'
          });
        }
      } else {
        if (assignedSubjects.length === 1) {
          targetSubjectId = assignedSubjects[0].id;
        } else {
          return res.status(400).json({
            error: 'Please select a subject from your assigned subjects.',
            messageGu: 'કૃપા કરીને તમારા સોંપાયેલા વિષયોમાંથી એક વિષય પસંદ કરો.'
          });
        }
      }
    }

    if (!title || !targetSubjectId || !dueDate) {
      return res.status(400).json({ error: 'Title, Subject, and Due Date are required.' });
    }

    // Parse questions array
    const questionsList: any[] = Array.isArray(questions) ? questions : [];

    // Calculate total marks from questions or default
    let calculatedMaxMarks = Number(maxMarks) || 0;
    if (questionsList.length > 0) {
      const sumQMarks = questionsList.reduce((acc, q) => acc + (Number(q.maxMarks) || 0), 0);
      if (sumQMarks > 0) calculatedMaxMarks = sumQMarks;
    }

    const homework = await prisma.homework.create({
      data: {
        title: title.trim(),
        titleGu: titleGu?.trim() || null,
        instructions: instructions?.trim() || null,
        instructionsGu: instructionsGu?.trim() || null,
        standard: standard || 'Standard 8',
        division: division || 'ALL',
        language: language || 'en',
        subjectId: targetSubjectId,
        chapterId: chapterId || null,
        topicId: topicId || null,
        teacherId,
        dueDate: new Date(dueDate),
        maxMarks: calculatedMaxMarks > 0 ? calculatedMaxMarks : 10.0,
        totalQuestions: questionsList.length,
        allowResubmission: allowResubmission !== false,
        questions: {
          create: questionsList.map((q, index) => ({
            questionNumber: Number(q.questionNumber) || index + 1,
            questionText: q.questionText.trim(),
            questionTextGu: q.questionTextGu?.trim() || null,
            maxMarks: Number(q.maxMarks) || 5.0,
            modelAnswer: q.modelAnswer?.trim() || '',
            modelAnswerGu: q.modelAnswerGu?.trim() || null,
            alternativeAnswers: q.alternativeAnswers ? JSON.stringify(q.alternativeAnswers) : null,
            rubricJson: q.rubric ? JSON.stringify(q.rubric) : null,
            keywordsJson: q.keywords ? JSON.stringify(q.keywords) : null
          }))
        }
      },
      include: {
        subject: true,
        chapter: true,
        topic: true,
        questions: { orderBy: { questionNumber: 'asc' } }
      }
    });

    // Notify enrolled students in that Standard/Division
    const studentQuery: any = { role: 'STUDENT' };
    if (standard && standard !== 'ALL') {
      studentQuery.profile = { standard };
    }

    const students = await prisma.user.findMany({
      where: studentQuery,
      select: { id: true }
    });

    for (const student of students) {
      await prisma.notification.create({
        data: {
          userId: student.id,
          title: `New Homework: ${homework.title}`,
          titleGu: `નવું ગૃહકાર્ય: ${homework.titleGu || homework.title}`,
          message: `Your teacher assigned new homework for ${homework.subject.name}. Due on ${new Date(dueDate).toLocaleDateString()}.`,
          messageGu: `${homework.subject.name} માટે નવું ગૃહકાર્ય આપવામાં આવ્યું છે. છેલ્લી તારીખ: ${new Date(dueDate).toLocaleDateString()}.`,
          type: 'HOMEWORK'
        }
      });
    }

    res.status(201).json({
      message: 'Homework created successfully with questions and rubrics',
      homework
    });
  } catch (error: any) {
    console.error('createHomework error:', error);
    res.status(500).json({ error: error.message || 'Failed to create homework' });
  }
};

/**
 * Update an existing Homework assignment, questions, and rubrics
 */
export const updateHomework = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      titleGu,
      instructions,
      instructionsGu,
      standard,
      division,
      language,
      subjectId,
      chapterId,
      topicId,
      dueDate,
      maxMarks,
      allowResubmission,
      questions
    } = req.body;

    const existing = await prisma.homework.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Homework not found' });

    if (req.user?.role === 'TEACHER') {
      const assignedSubjects = await getTeacherAssignedSubjects(prisma, req.user.id);
      const assignedSubjectIds = assignedSubjects.map(s => s.id);
      if (!assignedSubjectIds.includes(existing.subjectId)) {
        return res.status(403).json({
          error: 'You are not authorized to update homework for this subject.',
          messageGu: 'તમને આ વિષય માટેનું ગૃહકાર્ય બદલવાની મંજૂરી નથી.'
        });
      }
      if (subjectId && !assignedSubjectIds.includes(subjectId)) {
        return res.status(403).json({
          error: 'You are not authorized to assign homework to this subject.',
          messageGu: 'તમને આ વિષય માટે ગૃહકાર્ય સોંપવાની મંજૂરી નથી.'
        });
      }
    }

    const questionsList: any[] = Array.isArray(questions) ? questions : [];
    let calculatedMaxMarks = Number(maxMarks) || existing.maxMarks;
    if (questionsList.length > 0) {
      const sumQMarks = questionsList.reduce((acc, q) => acc + (Number(q.maxMarks) || 0), 0);
      if (sumQMarks > 0) calculatedMaxMarks = sumQMarks;
    }

    // Recreate questions if provided
    if (questionsList.length > 0) {
      await prisma.homeworkQuestion.deleteMany({ where: { homeworkId: id } });
    }

    const updated = await prisma.homework.update({
      where: { id },
      data: {
        title: title ? title.trim() : existing.title,
        titleGu: titleGu !== undefined ? titleGu : existing.titleGu,
        instructions: instructions !== undefined ? instructions : existing.instructions,
        instructionsGu: instructionsGu !== undefined ? instructionsGu : existing.instructionsGu,
        standard: standard || existing.standard,
        division: division !== undefined ? division : existing.division,
        language: language || existing.language,
        subjectId: subjectId || existing.subjectId,
        chapterId: chapterId !== undefined ? chapterId : existing.chapterId,
        topicId: topicId !== undefined ? topicId : existing.topicId,
        dueDate: dueDate ? new Date(dueDate) : existing.dueDate,
        maxMarks: calculatedMaxMarks,
        totalQuestions: questionsList.length > 0 ? questionsList.length : existing.totalQuestions,
        allowResubmission: allowResubmission !== undefined ? allowResubmission : existing.allowResubmission,
        questions: questionsList.length > 0 ? {
          create: questionsList.map((q, idx) => ({
            questionNumber: Number(q.questionNumber) || idx + 1,
            questionText: q.questionText.trim(),
            questionTextGu: q.questionTextGu?.trim() || null,
            maxMarks: Number(q.maxMarks) || 5.0,
            modelAnswer: q.modelAnswer?.trim() || '',
            modelAnswerGu: q.modelAnswerGu?.trim() || null,
            alternativeAnswers: q.alternativeAnswers ? JSON.stringify(q.alternativeAnswers) : null,
            rubricJson: q.rubric ? JSON.stringify(q.rubric) : null,
            keywordsJson: q.keywords ? JSON.stringify(q.keywords) : null
          }))
        } : undefined
      },
      include: {
        subject: true,
        chapter: true,
        topic: true,
        questions: { orderBy: { questionNumber: 'asc' } }
      }
    });

    res.json({ message: 'Homework updated successfully', homework: updated });
  } catch (error: any) {
    console.error('updateHomework error:', error);
    res.status(500).json({ error: 'Failed to update homework' });
  }
};

/**
 * Delete Homework assignment
 */
export const deleteHomework = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.homework.findUnique({
      where: { id },
      include: { submissions: true }
    });

    if (!existing) return res.status(404).json({ error: 'Homework not found' });

    // Clean up uploaded files
    existing.submissions.forEach(sub => {
      deletePersistedFile(sub.pdfFilePath, HOMEWORK_UPLOAD_DIR);
    });

    await prisma.homework.delete({ where: { id } });
    res.json({ message: 'Homework deleted successfully' });
  } catch (error: any) {
    console.error('deleteHomework error:', error);
    res.status(500).json({ error: 'Failed to delete homework' });
  }
};

/**
 * Get filtered submissions list for teachers with AI Checking & Review Status
 */
export const getTeacherSubmissions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { standard, division, subjectId, homeworkId, reviewStatus, status, search } = req.query;

    const where: any = {};

    if (standard && standard !== 'ALL') {
      where.homework = { standard: String(standard) };
    }

    if (division && division !== 'ALL') {
      where.homework = { ...where.homework, division: String(division) };
    }

    if (req.user?.role === 'TEACHER' && req.user?.id) {
      const teacherAssigned = await getTeacherAssignedSubjects(prisma, req.user.id);
      const teacherSubjectIds = teacherAssigned.map(s => s.id);

      if (subjectId && subjectId !== 'ALL') {
        if (!teacherSubjectIds.includes(String(subjectId))) {
          return res.status(403).json({
            error: 'You are not authorized to view submissions for this subject.',
            messageGu: 'તમને આ વિષયના સબમિશન જોવાની મંજૂરી નથી.'
          });
        }
        where.homework = { ...where.homework, subjectId: String(subjectId) };
      } else {
        where.homework = { ...where.homework, subjectId: { in: teacherSubjectIds } };
      }
    } else if (subjectId && subjectId !== 'ALL') {
      where.homework = { ...where.homework, subjectId: String(subjectId) };
    }

    if (homeworkId && homeworkId !== 'ALL') {
      where.homeworkId = String(homeworkId);
    }

    if (reviewStatus && reviewStatus !== 'ALL') {
      where.reviewStatus = String(reviewStatus);
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
            profile: true
          }
        },
        homework: {
          include: {
            subject: true,
            chapter: true,
            topic: true
          }
        },
        pages: { orderBy: { pageNumber: 'asc' } },
        evaluations: { orderBy: { questionNumber: 'asc' } }
      },
      orderBy: { submittedAt: 'desc' }
    });

    const formatted = submissions.map(sub => ({
      id: sub.id,
      homeworkId: sub.homeworkId,
      homeworkTitle: sub.homework.title,
      homeworkTitleGu: sub.homework.titleGu || sub.homework.title,
      standard: sub.homework.standard,
      division: sub.homework.division,
      subjectName: sub.homework.subject.name,
      subjectNameGu: sub.homework.subject.nameGu || sub.homework.subject.name,
      chapterName: sub.homework.chapter?.name || null,
      topicName: sub.homework.topic?.name || null,
      maxMarks: sub.homework.maxMarks,
      dueDate: sub.homework.dueDate,
      studentId: sub.student.id,
      studentName: sub.student.name,
      studentEmail: sub.student.email,
      studentStandard: sub.student.profile?.standard || sub.homework.standard,
      studentDivision: sub.student.profile?.division || 'A',
      status: sub.status,
      reviewStatus: sub.reviewStatus,
      submittedAt: sub.submittedAt,
      originalFileName: sub.originalFileName,
      fileSizeBytes: sub.fileSizeBytes,
      marksObtained: sub.marksObtained,
      aiScore: sub.aiScore,
      aiConfidence: sub.aiConfidence,
      isTeacherApproved: sub.isTeacherApproved,
      teacherComment: sub.teacherComment,
      teacherFeedback: sub.teacherFeedback,
      evaluatedAt: sub.evaluatedAt,
      submissionVersion: sub.submissionVersion,
      pageCount: sub.pages.length,
      needsTeacherReview: sub.evaluations.some(e => e.needsTeacherReview || e.confidenceLevel === 'LOW'),
      pdfUrl: `/api/homework/submissions/${sub.id}/pdf`
    }));

    res.json({ submissions: formatted });
  } catch (error: any) {
    console.error('getTeacherSubmissions error:', error);
    res.status(500).json({ error: 'Failed to fetch teacher submissions' });
  }
};

/**
 * Teacher Approval System:
 * Approve AI marks, modify marks, add comments, or send back for recheck.
 * Teacher's approved marks are always the final marks!
 */
export const reviewAndApproveSubmission = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teacherId = req.user?.id;
    const teacherName = req.user?.name || 'Teacher';
    const { id } = req.params;
    const {
      action, // 'APPROVE' | 'EDIT_MARKS' | 'RECHECK'
      finalMarks,
      teacherComment,
      questionMarks // optional array: [{ questionNumber: number, teacherMarks: number, teacherComment?: string }]
    } = req.body;

    const submission = await prisma.homeworkSubmission.findUnique({
      where: { id },
      include: {
        homework: true,
        student: { select: { id: true, name: true } },
        evaluations: true
      }
    });

    if (!submission) return res.status(404).json({ error: 'Submission not found' });

    const now = new Date();

    if (action === 'RECHECK') {
      // Send back for student re-check
      const updated = await prisma.homeworkSubmission.update({
        where: { id },
        data: {
          reviewStatus: 'RECHECK_REQUESTED',
          status: 'PENDING',
          teacherComment: teacherComment || 'Please re-submit your homework with clearer handwriting.'
        }
      });

      await prisma.homeworkAuditLog.create({
        data: {
          submissionId: id,
          action: 'RECHECK_REQUESTED',
          actorId: teacherId,
          actorName: teacherName,
          actorRole: 'TEACHER',
          notes: teacherComment || 'Teacher requested recheck/resubmission.'
        }
      });

      await prisma.notification.create({
        data: {
          userId: submission.studentId,
          title: `Homework Re-submission Requested: ${submission.homework.title}`,
          titleGu: `ગૃહકાર્ય પુનઃ-સબમિશન વિનંતી: ${submission.homework.titleGu || submission.homework.title}`,
          message: `Your teacher requested a re-check: "${teacherComment || 'Please check and resubmit.'}"`,
          messageGu: `શિક્ષકે પુનઃ-ચકાસણીની વિનંતી કરી છે: "${teacherComment || 'કૃપા કરીને તપાસો અને ફરીથી સબમિટ કરો.'}"`,
          type: 'HOMEWORK'
        }
      });

      return res.json({ message: 'Submission sent back for recheck', submission: updated });
    }

    // Process question-wise marks adjustments if provided
    let calculatedTotal = finalMarks !== undefined ? Number(finalMarks) : (submission.aiScore || 0);

    if (Array.isArray(questionMarks) && questionMarks.length > 0) {
      let sumEdited = 0;
      for (const qm of questionMarks) {
        const qNum = Number(qm.questionNumber);
        const marks = Number(qm.teacherMarks);
        sumEdited += marks;

        await prisma.questionEvaluation.updateMany({
          where: {
            submissionId: id,
            questionNumber: qNum
          },
          data: {
            teacherMarks: marks,
            teacherComment: qm.teacherComment || null,
            status: marks >= (submission.homework.maxMarks / submission.evaluations.length) * 0.9 ? 'CORRECT' : marks > 0 ? 'PARTIALLY_CORRECT' : 'INCORRECT'
          }
        });
      }
      calculatedTotal = sumEdited;
    }

    // Set Final Approved Result
    const previousScore = submission.marksObtained;
    const finalScore = Math.min(submission.homework.maxMarks, Math.max(0, calculatedTotal));

    const updated = await prisma.homeworkSubmission.update({
      where: { id },
      data: {
        marksObtained: finalScore,
        status: 'CHECKED',
        reviewStatus: 'APPROVED',
        isTeacherApproved: true,
        teacherApprovedAt: now,
        teacherComment: teacherComment || submission.teacherComment || null,
        teacherFeedback: teacherComment || submission.teacherFeedback || null,
        evaluatedAt: now,
        evaluatedBy: teacherId
      },
      include: {
        evaluations: { orderBy: { questionNumber: 'asc' } }
      }
    });

    // Audit Log for teacher approval
    await prisma.homeworkAuditLog.create({
      data: {
        submissionId: id,
        action: action === 'EDIT_MARKS' ? 'MARKS_EDITED' : 'TEACHER_APPROVED',
        actorId: teacherId,
        actorName: teacherName,
        actorRole: 'TEACHER',
        previousData: JSON.stringify({ previousScore, aiScore: submission.aiScore }),
        newData: JSON.stringify({ finalScore, teacherComment }),
        notes: `Teacher approved result with final score ${finalScore}/${submission.homework.maxMarks}`
      }
    });

    // Notify student about final approval
    await prisma.notification.create({
      data: {
        userId: submission.studentId,
        title: `Homework Approved: ${submission.homework.title}`,
        titleGu: `ગૃહકાર્ય પરિણામ મંજૂર: ${submission.homework.titleGu || submission.homework.title}`,
        message: `Your teacher approved your homework! Final Score: ${finalScore}/${submission.homework.maxMarks}. ${teacherComment ? `Feedback: "${teacherComment}"` : ''}`,
        messageGu: `તમારા શિક્ષકે તમારું પરિણામ મંજૂર કર્યું! અંતિમ ગુણ: ${finalScore}/${submission.homework.maxMarks}.`,
        type: 'HOMEWORK'
      }
    });

    res.json({
      message: 'Submission successfully reviewed and approved as Final.',
      submission: updated
    });
  } catch (error: any) {
    console.error('reviewAndApproveSubmission error:', error);
    res.status(500).json({ error: error.message || 'Failed to approve submission' });
  }
};

/**
 * Trigger automated AI recheck for a submission
 */
export const triggerAiRecheck = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const submission = await prisma.homeworkSubmission.findUnique({
      where: { id },
      include: {
        homework: { include: { questions: true } },
        pages: { orderBy: { pageNumber: 'asc' } }
      }
    });

    if (!submission) return res.status(404).json({ error: 'Submission not found' });

    const filePaths = submission.pages.map(p => path.join(HOMEWORK_UPLOAD_DIR, p.imagePath));
    const ocrResult = await processSubmissionFiles(filePaths, submission.homework.language || 'en');

    const questionsForGrading: QuestionInput[] = submission.homework.questions.map(q => ({
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      maxMarks: q.maxMarks,
      modelAnswer: q.modelAnswer,
      rubric: q.rubricJson ? JSON.parse(q.rubricJson) : null
    }));

    const evaluation = await evaluateHomeworkSubmission(
      questionsForGrading,
      ocrResult,
      submission.homework.language || 'en'
    );

    // Replace evaluations
    await prisma.questionEvaluation.deleteMany({ where: { submissionId: id } });
    for (const qRes of evaluation.questions) {
      const matched = submission.homework.questions.find(q => q.questionNumber === qRes.questionNumber);
      await prisma.questionEvaluation.create({
        data: {
          submissionId: id,
          questionId: matched?.id || null,
          questionNumber: qRes.questionNumber,
          studentAnswerText: qRes.studentAnswerText,
          aiMarks: qRes.aiMarks,
          maxMarks: qRes.maxMarks,
          status: qRes.status,
          confidenceScore: qRes.confidenceScore,
          confidenceLevel: qRes.confidenceLevel,
          needsTeacherReview: qRes.needsTeacherReview,
          rubricBreakdownJson: JSON.stringify(qRes.rubricBreakdown),
          missingPointsJson: JSON.stringify(qRes.missingPoints),
          incorrectStatementsJson: JSON.stringify(qRes.incorrectStatements),
          aiFeedback: qRes.aiFeedback
        }
      });
    }

    const updated = await prisma.homeworkSubmission.update({
      where: { id },
      data: {
        aiScore: evaluation.aiScore,
        aiFeedback: evaluation.overallFeedback,
        aiConfidence: evaluation.aiConfidence,
        reviewStatus: 'PENDING_TEACHER_REVIEW'
      },
      include: { evaluations: true }
    });

    res.json({ message: 'AI recheck completed successfully', submission: updated });
  } catch (error: any) {
    console.error('triggerAiRecheck error:', error);
    res.status(500).json({ error: 'Failed to run AI recheck' });
  }
};

/**
 * Teacher overview metrics and analytics
 */
export const getTeacherHomeworkOverview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const isTeacher = req.user?.role === 'TEACHER';
    let teacherSubjectFilter: any = {};
    let teacherSubjectsList: any[] = [];

    if (isTeacher && req.user?.id) {
      const assigned = await getTeacherAssignedSubjects(prisma, req.user.id);
      const subjectIds = assigned.map(s => s.id);
      teacherSubjectFilter = { subjectId: { in: subjectIds } };
      teacherSubjectsList = assigned;
    } else {
      teacherSubjectsList = await prisma.subject.findMany({ select: { id: true, name: true, nameGu: true } });
    }

    const [
      totalHomeworks,
      submissions,
      studentsCount,
      subjects
    ] = await Promise.all([
      prisma.homework.count({ where: teacherSubjectFilter }),
      prisma.homeworkSubmission.findMany({
        where: isTeacher ? { homework: teacherSubjectFilter } : undefined,
        include: { homework: true, evaluations: true }
      }),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      Promise.resolve(teacherSubjectsList)
    ]);

    let checkedCount = 0;
    let lateCount = 0;
    let submittedCount = 0;
    let pendingAiReviews = 0;
    let pendingTeacherReviews = 0;
    let lowConfidenceCount = 0;
    let totalMarksAwarded = 0;
    let totalMaxMarks = 0;

    submissions.forEach(sub => {
      if (sub.isTeacherApproved || sub.status === 'CHECKED') {
        checkedCount += 1;
        const marks = sub.marksObtained !== null ? sub.marksObtained : (sub.aiScore || 0);
        totalMarksAwarded += marks;
        totalMaxMarks += sub.homework.maxMarks;
      } else {
        if (sub.reviewStatus === 'PENDING_AI') {
          pendingAiReviews += 1;
        } else {
          pendingTeacherReviews += 1;
        }

        if (sub.aiConfidence === 'LOW' || sub.evaluations.some(e => e.needsTeacherReview)) {
          lowConfidenceCount += 1;
        }

        if (sub.status === 'LATE') {
          lateCount += 1;
        } else {
          submittedCount += 1;
        }
      }
    });

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
        pendingReviews: pendingTeacherReviews,
        pendingAiReviews,
        lowConfidenceCount,
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
 * Admin Comprehensive School-wide Homework Analytics
 */
export const getAdminHomeworkAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [
      totalStudents,
      totalTeachers,
      totalHomeworks,
      allSubmissions,
      evaluations,
      subjects
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'TEACHER' } }),
      prisma.homework.count(),
      prisma.homeworkSubmission.findMany({
        include: {
          homework: { include: { subject: true } },
          student: { select: { id: true, name: true } },
          evaluations: true
        }
      }),
      prisma.questionEvaluation.findMany({
        select: {
          questionNumber: true,
          status: true,
          missingPointsJson: true,
          confidenceLevel: true,
          aiMarks: true,
          maxMarks: true
        }
      }),
      prisma.subject.findMany({ select: { id: true, name: true, nameGu: true } })
    ]);

    let pendingSubmissions = 0;
    let pendingAiReviews = 0;
    let pendingTeacherApprovals = 0;
    let approvedCount = 0;
    let totalMarks = 0;
    let totalMax = 0;

    const subjectStats: Record<string, { total: number; marks: number; max: number }> = {};
    const commonMistakesCount: Record<string, number> = {};

    allSubmissions.forEach(sub => {
      if (sub.isTeacherApproved) {
        approvedCount++;
        const s = sub.marksObtained || 0;
        totalMarks += s;
        totalMax += sub.homework.maxMarks;

        const subName = sub.homework.subject.name;
        if (!subjectStats[subName]) subjectStats[subName] = { total: 0, marks: 0, max: 0 };
        subjectStats[subName].total++;
        subjectStats[subName].marks += s;
        subjectStats[subName].max += sub.homework.maxMarks;
      } else {
        if (sub.reviewStatus === 'PENDING_AI') pendingAiReviews++;
        else pendingTeacherApprovals++;
      }
    });

    evaluations.forEach(ev => {
      try {
        if (ev.missingPointsJson) {
          const list: string[] = JSON.parse(ev.missingPointsJson);
          list.forEach(item => {
            const trimmed = item.trim();
            if (trimmed.length > 3) {
              commonMistakesCount[trimmed] = (commonMistakesCount[trimmed] || 0) + 1;
            }
          });
        }
      } catch (e) {
        // ignore
      }
    });

    const topCommonMistakes = Object.entries(commonMistakesCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([mistake, count]) => ({ mistake, count }));

    const subjectAverages = Object.entries(subjectStats).map(([subject, data]) => ({
      subject,
      average: data.max > 0 ? Math.round((data.marks / data.max) * 100) : 0,
      submissions: data.total
    }));

    const classAverage = totalMax > 0 ? Math.round((totalMarks / totalMax) * 100) : 0;
    const totalExpected = totalHomeworks * Math.max(totalStudents, 1);
    const completionRate = totalExpected > 0 ? Math.round((allSubmissions.length / totalExpected) * 100) : 0;

    res.json({
      analytics: {
        totalStudents,
        totalTeachers,
        totalHomework: totalHomeworks,
        totalSubmissions: allSubmissions.length,
        pendingSubmissions,
        pendingAiReviews,
        pendingTeacherApprovals,
        approvedCount,
        classAverage,
        completionRate,
        subjectAverages,
        topCommonMistakes
      }
    });
  } catch (error: any) {
    console.error('getAdminHomeworkAnalytics error:', error);
    res.status(500).json({ error: 'Failed to fetch admin analytics' });
  }
};

/**
 * Parent Dashboard Overview:
 * View child's homework submissions, marks, feedback (Read-Only)
 */
export const getParentHomeworkOverview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parentUserId = req.user?.id;
    const { studentId } = req.query;

    if (!parentUserId) return res.status(401).json({ error: 'Unauthorized' });

    // Find student ID associated with parent or provided in query
    let targetStudentId = String(studentId || '');
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
      // If no mapping, allow fallback to first student for demo / testing
      const firstStudent = await prisma.user.findFirst({
        where: { role: 'STUDENT' },
        select: { id: true, name: true }
      });
      targetStudentId = firstStudent?.id || '';
    }

    const studentUser = await prisma.user.findUnique({
      where: { id: targetStudentId },
      include: { profile: true }
    });

    if (!studentUser) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const homeworks = await prisma.homework.findMany({
      where: {
        OR: [
          { standard: studentUser.profile?.standard || 'Standard 8' },
          { standard: 'ALL' }
        ]
      },
      include: {
        subject: true,
        submissions: {
          where: { studentId: targetStudentId },
          include: {
            evaluations: { orderBy: { questionNumber: 'asc' } },
            pages: { orderBy: { pageNumber: 'asc' } }
          }
        }
      },
      orderBy: { dueDate: 'desc' }
    });

    const now = new Date();
    const formatted = homeworks.map(hw => {
      const sub = hw.submissions[0] || null;
      let status = 'PENDING';
      if (sub) {
        status = sub.isTeacherApproved ? 'APPROVED' : sub.status;
      } else if (now > new Date(hw.dueDate)) {
        status = 'LATE';
      }

      return {
        homeworkId: hw.id,
        title: hw.title,
        titleGu: hw.titleGu || hw.title,
        subject: hw.subject.name,
        subjectGu: hw.subject.nameGu || hw.subject.name,
        dueDate: hw.dueDate,
        maxMarks: hw.maxMarks,
        status,
        submittedAt: sub?.submittedAt || null,
        marksObtained: sub?.marksObtained || (sub?.isTeacherApproved ? sub?.aiScore : null),
        aiScore: sub?.aiScore || null,
        isTeacherApproved: sub?.isTeacherApproved || false,
        teacherFeedback: sub?.teacherComment || sub?.teacherFeedback || null,
        aiFeedback: sub?.aiFeedback || null,
        submissionId: sub?.id || null
      };
    });

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
      homeworks: formatted
    });
  } catch (error: any) {
    console.error('getParentHomeworkOverview error:', error);
    res.status(500).json({ error: 'Failed to fetch parent overview' });
  }
};

/**
 * Stream submission original PDF or combined file
 */
export const streamSubmissionPdf = async (req: AuthenticatedRequest, res: Response) => {
  return streamSubmissionPageFile(req, res);
};

// Backwards-compatibility aliases
export const evaluateSubmission = reviewAndApproveSubmission;
export const submitHomeworkPdf = submitStudentHomework;
