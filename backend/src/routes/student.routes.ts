import { Router } from 'express';
import {
  getDashboard,
  getPerformance,
  getWeakTopics,
  getTopicHeatmap,
  getPredictions,
  getSubjectsList,
  getParentStudentOverview,
  updateParentStudentSettings
} from '../controllers/studentController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/dashboard', authenticateToken, getDashboard);
router.get('/performance', authenticateToken, getPerformance);
router.get('/weak-topics', authenticateToken, getWeakTopics);
router.get('/heatmap', authenticateToken, getTopicHeatmap);
router.get('/predictions', authenticateToken, getPredictions);
router.get('/subjects', authenticateToken, getSubjectsList);
router.get('/parent-overview', authenticateToken, getParentStudentOverview);
router.put('/parent-settings', authenticateToken, updateParentStudentSettings);

export default router;
