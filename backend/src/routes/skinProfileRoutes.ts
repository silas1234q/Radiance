import { Router } from 'express';
import { requireAuth } from '../middleware/clerkAuth';
import { syncUser } from '../middleware/syncUser';
import { getSkinProfile, createSkinProfile, analyzeProfile, analyzeWithScan, getWeeklyPlanController } from '../controllers/skinProfileController';

const router = Router();
router.use(requireAuth(), syncUser);
router.get('/', getSkinProfile);
router.post('/', createSkinProfile);
router.post('/analyze', analyzeProfile);
router.post('/analyze-with-scan', analyzeWithScan);
router.get('/weekly-plan', getWeeklyPlanController);
export default router;
