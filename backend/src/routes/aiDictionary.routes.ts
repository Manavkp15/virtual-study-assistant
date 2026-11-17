import { Router } from 'express';
import {
  searchWord,
  getSavedWords,
  saveWord,
  removeSavedWord,
  getRecentSearches,
  clearSearchHistory
} from '../controllers/aiDictionaryController';
import { authenticateToken, optionalAuthToken } from '../middleware/auth';

const router = Router();

router.post('/search', optionalAuthToken, searchWord);
router.get('/saved', authenticateToken, getSavedWords);
router.post('/saved', authenticateToken, saveWord);
router.delete('/saved/:id', authenticateToken, removeSavedWord);
router.get('/recent', authenticateToken, getRecentSearches);
router.delete('/recent', authenticateToken, clearSearchHistory);

export default router;
