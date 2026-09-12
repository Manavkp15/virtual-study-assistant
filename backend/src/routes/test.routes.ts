import { Router } from 'express';
import { getTests, getTestById, submitTest } from '../controllers/testController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getTests);
router.get('/:id', authenticateToken, getTestById);
router.post('/:id/submit', authenticateToken, submitTest);

export default router;
