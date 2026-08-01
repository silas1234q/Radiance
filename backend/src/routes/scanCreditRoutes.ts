import { Router } from 'express';
import { requireAuth } from '../middleware/clerkAuth';
import { syncUser } from '../middleware/syncUser';
import { getScanCredits, verifyPurchase } from '../controllers/scanCreditController';

const router = Router();
router.use(requireAuth(), syncUser);
router.get('/', getScanCredits);
router.post('/verify-purchase', verifyPurchase);
export default router;
