import { Router } from 'express';
import { requireAuth } from '../middleware/clerkAuth';
import { syncUser } from '../middleware/syncUser';
import { createSkinLog, getSkinLogs, upsertTodayLog, getTodayLog } from '../controllers/skinLogController';

const router = Router();
router.use(requireAuth(), syncUser);
router.post('/', createSkinLog);
router.get('/', getSkinLogs);
router.put('/today', upsertTodayLog);
router.get('/today', getTodayLog);
export default router;
