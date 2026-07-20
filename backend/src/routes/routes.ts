import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import quizRoutes from './quizRoutes';
import skinProfileRoutes from './skinProfileRoutes';
import routineRoutes from './routineRoutes';
import skinLogRoutes from './skinLogRoutes';
import skinScoreRoutes from './skinScoreRoutes';
import moodRoutes from './moodRoutes';
import productRoutes from './productRoutes';
import uploadRoutes from './uploadRoutes';
import gamificationRoutes from './gamificationRoutes';
import userProductRoutes from './userProductRoutes';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/quiz', quizRoutes);
router.use('/skin-profile', skinProfileRoutes);
router.use('/routines', routineRoutes);
router.use('/skin-logs', skinLogRoutes);
router.use('/skin-scores', skinScoreRoutes);
router.use('/moods', moodRoutes);
router.use('/products', productRoutes);
router.use('/upload', uploadRoutes);
router.use('/gamification', gamificationRoutes);
router.use('/user-products', userProductRoutes);

export default router;
