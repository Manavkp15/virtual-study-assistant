import { Router } from 'express';
import {
  getDashboard,
  getPerformance,
  getWeakTopics,
  getTopicHeatmap,
  getPredictions,
  getSubjectsList
} from '../controllers/studentController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/dashboard', authenticateToken, getDashboard);
router.get('/performance', authenticateToken, getPerformance);
router.get('/weak-topics', authenticateToken, getWeakTopics);
router.get('/heatmap', authenticateToken, getTopicHeatmap);
router.get('/predictions', authenticateToken, getPredictions);
router.get('/subjects', authenticateToken, getSubjectsList);

export default router;
