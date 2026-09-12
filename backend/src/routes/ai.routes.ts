import { Router } from 'express';
import { getGuidance, askAI } from '../controllers/aiController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/guidance', authenticateToken, getGuidance);
router.post('/chat', authenticateToken, askAI);

export default router;
