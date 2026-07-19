import { Router } from 'express';
import { requireAuth } from '../middleware/clerkAuth';
import { syncUser } from '../middleware/syncUser';
import { submitQuiz, getQuizAnswers } from '../controllers/quizController';

const router = Router();
router.use(requireAuth(), syncUser);
router.post('/', submitQuiz);
router.get('/', getQuizAnswers);
export default router;
