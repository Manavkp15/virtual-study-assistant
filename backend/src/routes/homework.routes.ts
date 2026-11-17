import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { homeworkMultiUpload } from '../services/fileStorage';
import {
  getStudentHomeworks,
  getStudentHomeworkSummary,
  getHomeworkById,
  submitStudentHomework,
  getSubmissionDetails,
  streamSubmissionPageFile,
  streamSubmissionPdf,
  getTeacherHomeworkOverview,
  getTeacherSubmissions,
  createHomework,
  updateHomework,
  deleteHomework,
  reviewAndApproveSubmission,
  triggerAiRecheck,
  getAdminHomeworkAnalytics,
  getParentHomeworkOverview,
  evaluateSubmission
} from '../controllers/homeworkController';

const router = Router();

// Multi-file upload middleware (PDF, JPG, PNG, WEBP)
const handleHomeworkUpload = (req: any, res: any, next: any) => {
  homeworkMultiUpload(req, res, (err: any) => {
    if (err) {
      if (err.message === 'ONLY_PDF_AND_IMAGES_ALLOWED') {
        return res.status(400).json({ error: 'Only PDF documents or image files (JPG, PNG, WEBP) are allowed' });
      }
      return res.status(400).json({ error: err.message || 'File upload error' });
    }
    next();
  });
};

// ============================================================================
// STUDENT ROUTES
// ============================================================================
router.get('/student', authenticateToken, getStudentHomeworks);
router.get('/student/summary', authenticateToken, getStudentHomeworkSummary);
router.get('/submissions/:id/details', authenticateToken, getSubmissionDetails);
router.get('/submissions/:id/pdf', authenticateToken, streamSubmissionPdf);
router.get('/submissions/:id/file/:pageId', authenticateToken, streamSubmissionPageFile);
router.get('/:id', authenticateToken, getHomeworkById);
router.post('/:id/submit', authenticateToken, handleHomeworkUpload, submitStudentHomework);

// ============================================================================
// PARENT ROUTES (Read-Only)
// ============================================================================
router.get('/parent/overview', authenticateToken, getParentHomeworkOverview);

// ============================================================================
// TEACHER / ADMIN ROUTES
// ============================================================================
router.get('/teacher/overview', authenticateToken, requireAdmin, getTeacherHomeworkOverview);
router.get('/teacher/submissions', authenticateToken, requireAdmin, getTeacherSubmissions);
router.post('/', authenticateToken, requireAdmin, createHomework);
router.put('/:id', authenticateToken, requireAdmin, updateHomework);
router.delete('/:id', authenticateToken, requireAdmin, deleteHomework);

// Teacher approval & marks adjustment
router.post('/submissions/:id/review', authenticateToken, requireAdmin, reviewAndApproveSubmission);
router.patch('/submissions/:id/evaluate', authenticateToken, requireAdmin, reviewAndApproveSubmission);
router.put('/submissions/:id/evaluate', authenticateToken, requireAdmin, reviewAndApproveSubmission);
router.post('/submissions/:id/recheck', authenticateToken, requireAdmin, triggerAiRecheck);

// ============================================================================
// ADMIN ANALYTICS ROUTES
// ============================================================================
router.get('/admin/analytics', authenticateToken, requireAdmin, getAdminHomeworkAnalytics);

export default router;
