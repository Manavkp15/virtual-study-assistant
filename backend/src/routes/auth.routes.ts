import { Router } from 'express';
import {
  register,
  login,
  verifyEmail,
  resendVerification,
  quickVerify,
  getCurrentUser,
  updateProfile,
  getTeacherSubjectMappings,
  updateTeacherSubjectMappings,
  getTeacherAssignedSubjectsList,
  forgotPassword,
  uploadAvatar,
  removeAvatar
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { avatarUpload } from '../services/fileStorage';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify-email', verifyEmail);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/quick-verify', quickVerify);
router.post('/forgot-password', forgotPassword);
router.get('/me', authenticateToken, getCurrentUser);
router.put('/profile', authenticateToken, updateProfile);

// Teacher subject mapping routes
router.get('/teacher/subjects', authenticateToken, getTeacherSubjectMappings);
router.get('/teacher/assigned-subjects', authenticateToken, getTeacherAssignedSubjectsList);
router.put('/teacher/subject-mappings', authenticateToken, updateTeacherSubjectMappings);

// Avatar management routes
router.post('/avatar', authenticateToken, (req, res, next) => {
  avatarUpload.single('avatar')(req, res, (err: any) => {
    if (err) {
      if (err.message === 'ONLY_IMAGE_ALLOWED') {
        return res.status(400).json({ error: 'Only image files (JPG, PNG, WEBP) are allowed.' });
      }
      return res.status(400).json({ error: err.message || 'Avatar upload error' });
    }
    next();
  });
}, uploadAvatar);

router.delete('/avatar', authenticateToken, removeAvatar);

export default router;
