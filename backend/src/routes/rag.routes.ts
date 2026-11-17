import { Router } from 'express';
import {
  askTextbook,
  listTextbooks,
  uploadTextbook,
  updateTextbook,
  deleteTextbook,
  getRAGStats,
  getTaxonomy,
  browseTextbookContent,
  getNcertAudits
} from '../controllers/ragController';
import { authenticateToken } from '../middleware/auth';
import { studyMaterialUpload } from '../services/fileStorage';

const router = Router();

// Student Q&A with NCERT textbook grounding
router.post('/ask', authenticateToken, askTextbook);

// Knowledge base exploration endpoints
router.get('/textbooks', authenticateToken, listTextbooks);
router.get('/stats', authenticateToken, getRAGStats);
router.get('/taxonomy', authenticateToken, getTaxonomy);
router.get('/browse', authenticateToken, browseTextbookContent);
router.get('/audits', authenticateToken, getNcertAudits);

// Teacher / Admin textbook management
router.post('/textbooks/upload', authenticateToken, studyMaterialUpload.single('file'), uploadTextbook);
router.put('/textbooks/:id', authenticateToken, updateTextbook);
router.delete('/textbooks/:id', authenticateToken, deleteTextbook);

export default router;
