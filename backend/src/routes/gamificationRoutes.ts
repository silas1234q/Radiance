import { Router } from 'express';
import { requireAuth } from '../middleware/clerkAuth';
import { syncUser } from '../middleware/syncUser';
import { getSummary, restoreStreak, getWeeklyCompletions, getXpHistory } from '../controllers/gamificationController';

const router = Router();
router.use(requireAuth(), syncUser);
router.get('/', getSummary);
router.post('/restore-streak', restoreStreak);
router.get('/weekly', getWeeklyCompletions);
router.get('/xp-history', getXpHistory);
export default router;
