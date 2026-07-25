import { Router } from 'express';
import { requireAuth } from '../middleware/clerkAuth';
import { syncUser } from '../middleware/syncUser';
import { getMe, updateMe, updatePushToken, sendTestPush, deleteMe } from '../controllers/userController';

const router = Router();
router.use(requireAuth(), syncUser);
router.get('/me', getMe);
router.patch('/me', updateMe);
router.put('/me/push-token', updatePushToken);
router.post('/me/test-push', sendTestPush);
router.delete('/me', deleteMe);
export default router;
