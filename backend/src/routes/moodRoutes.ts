import { Router } from 'express';
import { requireAuth } from '../middleware/clerkAuth';
import { syncUser } from '../middleware/syncUser';
import { createMood, getMoods } from '../controllers/moodController';

const router = Router();
router.use(requireAuth(), syncUser);
router.post('/', createMood);
router.get('/', getMoods);
export default router;
