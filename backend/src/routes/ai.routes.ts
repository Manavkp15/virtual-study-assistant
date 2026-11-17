import { Router } from 'express';
import { getGuidance, askAI, askMultimodal, summarizePdf, solveStepByStep } from '../controllers/aiController';
import { authenticateToken, optionalAuthToken } from '../middleware/auth';
import { queryUpload } from '../services/fileStorage';

const router = Router();

router.get('/guidance', authenticateToken, getGuidance);
router.post('/chat', authenticateToken, askAI);
router.post('/ask-multimodal', authenticateToken, queryUpload.single('image'), askMultimodal);
router.post('/summarize-pdf', optionalAuthToken, summarizePdf);
router.post('/solve-step-by-step', optionalAuthToken, solveStepByStep);

export default router;
