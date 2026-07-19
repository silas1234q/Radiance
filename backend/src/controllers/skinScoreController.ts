import { catchAsync } from '../utils/catchAsync';
import prisma from '../config/db.config';

export const getSkinScores = catchAsync(async (req, res) => {
  const scores = await prisma.skinScore.findMany({
    where: { userId: req.user!.id },
    orderBy: { date: 'desc' },
    take: 7,
  });
  res.json(scores);
});

export const getLatestScore = catchAsync(async (req, res) => {
  const score = await prisma.skinScore.findFirst({
    where: { userId: req.user!.id },
    orderBy: { date: 'desc' },
  });
  res.json(score);
});
