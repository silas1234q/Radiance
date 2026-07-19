import { Router } from 'express';
import { requireAuth } from '../middleware/clerkAuth';
import { syncUser } from '../middleware/syncUser';
import { getSkinScores, getLatestScore } from '../controllers/skinScoreController';

const router = Router();
router.use(requireAuth(), syncUser);
router.get('/', getSkinScores);
router.get('/latest', getLatestScore);
export default router;
