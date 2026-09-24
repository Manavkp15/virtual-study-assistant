import { Router } from 'express';
import {
  askTextbook,
  listTextbooks,
  uploadTextbook,
  deleteTextbook,
  getRAGStats
} from '../controllers/ragController';
import { authenticateToken } from '../middleware/auth';
import { studyMaterialUpload } from '../services/fileStorage';

const router = Router();

// Student Q&A with textbook grounding
router.post('/ask', authenticateToken, askTextbook);

// Knowledge base endpoints
router.get('/textbooks', authenticateToken, listTextbooks);
router.get('/stats', authenticateToken, getRAGStats);

// Teacher / Admin textbook management
router.post('/textbooks/upload', authenticateToken, studyMaterialUpload.single('file'), uploadTextbook);
router.delete('/textbooks/:id', authenticateToken, deleteTextbook);

export default router;
