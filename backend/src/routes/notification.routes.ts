import { Router } from 'express';
import { getNotifications, markNotificationAsRead } from '../controllers/notificationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getNotifications);
router.patch('/:id/read', authenticateToken, markNotificationAsRead);

export default router;
