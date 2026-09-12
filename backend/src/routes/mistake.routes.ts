import { Router } from 'express';
import { getMistakes, resolveMistake } from '../controllers/mistakeController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getMistakes);
router.patch('/:id/resolve', authenticateToken, resolveMistake);

export default router;
