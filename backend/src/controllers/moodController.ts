import { catchAsync } from '../utils/catchAsync';
import prisma from '../config/db.config';
import * as gamificationService from '../services/gamificationService';

export const createMood = catchAsync(async (req, res) => {
  const { mood, occurredAt } = req.body;
  // The app may have queued this while offline; `occurredAt` is when the user
  // actually logged the mood, so a replay after midnight credits the right day.
  const { day } = gamificationService.resolveOccurrence(occurredAt);

  const entry = await prisma.moodEntry.upsert({
    where: { userId_date: { userId: req.user!.id, date: day } },
    update: { mood },
    create: { userId: req.user!.id, mood, date: day },
  });

  // Gamification: award XP for logging mood
  const userId = req.user!.id;
  await gamificationService.awardXp(userId, 'LOG_MOOD', 15, day);
  await gamificationService.updateDailyCompletion(userId, 'moodLogged', day);

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
