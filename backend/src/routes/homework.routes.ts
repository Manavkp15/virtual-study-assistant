import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { homeworkUpload } from '../services/fileStorage';
import {
  getStudentHomeworks,
  getStudentHomeworkSummary,
  getHomeworkById,
  submitHomeworkPdf,
  streamSubmissionPdf,
  getTeacherHomeworkOverview,
  getTeacherSubmissions,
  createHomework,
  updateHomework,
  deleteHomework,
  evaluateSubmission
} from '../controllers/homeworkController';

const router = Router();

// Upload middleware with clean error handling (strict PDF, no file size limits)
const handleHomeworkUpload = (req: any, res: any, next: any) => {
  homeworkUpload.single('file')(req, res, (err: any) => {
    if (err) {
      if (err.message === 'ONLY_PDF_ALLOWED') {
        return res.status(400).json({ error: 'Only PDF documents (.pdf) are allowed' });
      }
      return res.status(400).json({ error: err.message || 'File upload error' });
    }
    next();
  });
};

// Student Routes
router.get('/student', authenticateToken, getStudentHomeworks);
router.get('/student/summary', authenticateToken, getStudentHomeworkSummary);
router.get('/submissions/:id/pdf', authenticateToken, streamSubmissionPdf);
router.get('/:id', authenticateToken, getHomeworkById);
router.post('/:id/submit', authenticateToken, handleHomeworkUpload, submitHomeworkPdf);

// Teacher / Admin Routes
router.get('/teacher/overview', authenticateToken, requireAdmin, getTeacherHomeworkOverview);
router.get('/teacher/submissions', authenticateToken, requireAdmin, getTeacherSubmissions);
router.post('/', authenticateToken, requireAdmin, createHomework);
router.put('/:id', authenticateToken, requireAdmin, updateHomework);
router.delete('/:id', authenticateToken, requireAdmin, deleteHomework);
router.patch('/submissions/:id/evaluate', authenticateToken, requireAdmin, evaluateSubmission);
router.put('/submissions/:id/evaluate', authenticateToken, requireAdmin, evaluateSubmission);

export default router;
