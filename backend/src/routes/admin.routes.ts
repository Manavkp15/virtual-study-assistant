import { Router } from 'express';
import {
  getAdminOverview,
  createSubject,
  updateSubject,
  deleteSubject,
  createChapter,
  createTopic,
  getQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  createTest
} from '../controllers/adminController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticateToken, requireAdmin);

router.get('/overview', getAdminOverview);
router.post('/subjects', createSubject);
router.put('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject);

router.post('/chapters', createChapter);
router.post('/topics', createTopic);

router.get('/questions', getQuestions);
router.post('/questions', addQuestion);
router.put('/questions/:id', updateQuestion);
router.delete('/questions/:id', deleteQuestion);

router.post('/tests', createTest);

export default router;
