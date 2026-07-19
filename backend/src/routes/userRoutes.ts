import { Router } from 'express';
import { requireAuth } from '../middleware/clerkAuth';
import { syncUser } from '../middleware/syncUser';
import { getMe, updateMe } from '../controllers/userController';

const router = Router();
router.use(requireAuth(), syncUser);
router.get('/me', getMe);
router.patch('/me', updateMe);
export default router;
