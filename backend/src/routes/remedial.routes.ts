import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createFromAttempt,
  getSession,
  getRemedialTest,
  submitRemedialTest,
  getRemedialHistory,
  getActiveRemedial
} from '../controllers/remedialController';

const router = Router();

router.use(authenticateToken);

router.post('/create-from-attempt/:attemptId', createFromAttempt);
router.post('/create-from-attempt', createFromAttempt);
router.get('/session/:sessionId', getSession);
router.get('/session/:sessionId/test', getRemedialTest);
router.post('/session/:sessionId/submit', submitRemedialTest);
router.get('/history', getRemedialHistory);
router.get('/active', getActiveRemedial);

export default router;
