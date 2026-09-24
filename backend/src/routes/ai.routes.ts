import { Router } from 'express';
import { getGuidance, askAI, askMultimodal } from '../controllers/aiController';
import { authenticateToken } from '../middleware/auth';
import { queryUpload } from '../services/fileStorage';

const router = Router();

router.get('/guidance', authenticateToken, getGuidance);
router.post('/chat', authenticateToken, askAI);
router.post('/ask-multimodal', authenticateToken, queryUpload.single('image'), askMultimodal);

export default router;
