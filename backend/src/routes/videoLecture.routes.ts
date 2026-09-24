import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { videoLectureUpload } from '../services/fileStorage';
import {
  createVideoLecture,
  getTeacherVideoLectures,
  deleteVideoLecture,
  getStudentVideoLectures,
  getVideoLectureById,
  streamVideoLecture,
  trackVideoView
} from '../controllers/videoLectureController';

const router = Router();

// Middleware to handle MP4 video file upload with field normalization
const handleVideoUpload = (req: any, res: any, next: any) => {
  const uploadSingle = videoLectureUpload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'file', maxCount: 1 }
  ]);

  uploadSingle(req, res, (err: any) => {
    if (err) {
      if (err.message === 'ONLY_MP4_ALLOWED') {
        return res.status(400).json({ error: 'Only MP4 video files (.mp4) are allowed. External links are not accepted.' });
      }
      return res.status(400).json({ error: err.message || 'Video upload error' });
    }

    if (req.files) {
      const filesObj = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (filesObj['video'] && filesObj['video'][0]) {
        req.file = filesObj['video'][0];
      } else if (filesObj['file'] && filesObj['file'][0]) {
        req.file = filesObj['file'][0];
      }
    }
    next();
  });
};

// ============================================================================
// STUDENT & STREAMING ROUTES
// ============================================================================
router.get('/student', authenticateToken, getStudentVideoLectures);
router.get('/:id/stream', streamVideoLecture);
router.post('/:id/view', authenticateToken, trackVideoView);
router.get('/:id', authenticateToken, getVideoLectureById);

// ============================================================================
// TEACHER / ADMIN ROUTES
// ============================================================================
router.get('/teacher/overview', authenticateToken, requireAdmin, getTeacherVideoLectures);
router.get('/teacher/all', authenticateToken, requireAdmin, getTeacherVideoLectures);
router.post('/teacher/upload', authenticateToken, requireAdmin, handleVideoUpload, createVideoLecture);
router.delete('/teacher/:id', authenticateToken, requireAdmin, deleteVideoLecture);

export default router;
