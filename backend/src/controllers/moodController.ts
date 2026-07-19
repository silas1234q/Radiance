import { catchAsync } from '../utils/catchAsync';
import prisma from '../config/db.config';
import * as gamificationService from '../services/gamificationService';

export const createMood = catchAsync(async (req, res) => {
  const { mood } = req.body;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const entry = await prisma.moodEntry.upsert({
    where: { userId_date: { userId: req.user!.id, date: today } },
    update: { mood },
    create: { userId: req.user!.id, mood, date: today },
  });

  // Gamification: award XP for logging mood
  const userId = req.user!.id;
  await gamificationService.awardXp(userId, 'LOG_MOOD', 15, today);
  await gamificationService.updateDailyCompletion(userId, 'moodLogged');

  res.json(entry);
});

export const getMoods = catchAsync(async (req, res) => {
  const moods = await prisma.moodEntry.findMany({
    where: { userId: req.user!.id },
    orderBy: { date: 'desc' },
    take: 30,
  });
  res.json(moods);
});
