import { Router } from 'express';
import { getTodayPlan, generatePlan, toggleTask } from '../controllers/studyPlanController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/today', authenticateToken, getTodayPlan);
router.post('/generate', authenticateToken, generatePlan);
router.patch('/tasks/:id/toggle', authenticateToken, toggleTask);

export default router;
