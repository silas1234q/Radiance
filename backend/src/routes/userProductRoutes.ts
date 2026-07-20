import { Router } from 'express';
import { requireAuth } from '../middleware/clerkAuth';
import { syncUser } from '../middleware/syncUser';
import { getUserProducts, addUserProduct, removeUserProduct } from '../controllers/userProductController';

const router = Router();
router.use(requireAuth(), syncUser);
router.get('/', getUserProducts);
router.post('/', addUserProduct);
router.delete('/:productId', removeUserProduct);

export default router;
