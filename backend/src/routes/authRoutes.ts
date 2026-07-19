import { Router } from 'express';
import { requireAuth } from '../middleware/clerkAuth';
import { registerUserOrLogin } from '../controllers/authController';

const router = Router();

router.post('/sync', requireAuth(), registerUserOrLogin);

export default router;
