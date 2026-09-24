import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { studyMaterialUpload } from '../services/fileStorage';
import {
  getStudentMaterials,
  getRecommendedMaterials,
  getStudentMaterialSummary,
  getMaterialById,
  streamMaterialPdf,
  downloadMaterialPdf,
  trackMaterialEvent,
  getTeacherMaterialOverview,
  getTeacherMaterials,
  createStudyMaterial,
  updateStudyMaterial,
  updateMaterialStatus,
  deleteStudyMaterial
} from '../controllers/studyMaterialController';

const router = Router();

// Upload middleware with strict PDF error handling and zero size limits
// Accepts either 'file' or 'pdf' as form field name
const handleMaterialUpload = (req: any, res: any, next: any) => {
  const uploadSingle = studyMaterialUpload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'pdf', maxCount: 1 }
  ]);

  uploadSingle(req, res, (err: any) => {
    if (err) {
      if (err.message === 'ONLY_PDF_ALLOWED') {
        return res.status(400).json({ error: 'Only PDF documents (.pdf) are allowed' });
      }
      return res.status(400).json({ error: err.message || 'File upload error' });
    }

    // Normalize req.file from either 'file' or 'pdf' field
    if (req.files) {
      const filesObj = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (filesObj['file'] && filesObj['file'][0]) {
        req.file = filesObj['file'][0];
      } else if (filesObj['pdf'] && filesObj['pdf'][0]) {
        req.file = filesObj['pdf'][0];
      }
    }
    next();
  });
};

// ============================================================================
// STUDENT ROUTES
// ============================================================================
router.get('/student', authenticateToken, getStudentMaterials);
router.get('/student/recommendations', authenticateToken, getRecommendedMaterials);
router.get('/student/summary', authenticateToken, getStudentMaterialSummary);
router.get('/:id/pdf', authenticateToken, streamMaterialPdf);
router.get('/:id/download', authenticateToken, downloadMaterialPdf);
router.post('/:id/event', authenticateToken, trackMaterialEvent);
router.get('/:id', authenticateToken, getMaterialById);

// ============================================================================
// TEACHER / ADMIN ROUTES
// ============================================================================
router.get('/teacher/overview', authenticateToken, requireAdmin, getTeacherMaterialOverview);
router.get('/teacher/list', authenticateToken, requireAdmin, getTeacherMaterials);
router.post('/', authenticateToken, requireAdmin, handleMaterialUpload, createStudyMaterial);
router.put('/:id', authenticateToken, requireAdmin, handleMaterialUpload, updateStudyMaterial);
router.patch('/:id/status', authenticateToken, requireAdmin, updateMaterialStatus);
router.delete('/:id', authenticateToken, requireAdmin, deleteStudyMaterial);

export default router;
