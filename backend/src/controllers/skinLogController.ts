import { catchAsync } from '../utils/catchAsync';
import prisma from '../config/db.config';

export const createSkinLog = catchAsync(async (req, res) => {
  const { lifestyleFactors, notes, photoUrl } = req.body;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const log = await prisma.skinLog.upsert({
    where: { userId_date: { userId: req.user!.id, date: today } },
    update: { lifestyleFactors, notes, photoUrl },
    create: { userId: req.user!.id, date: today, lifestyleFactors, notes, photoUrl },
  });
  res.status(201).json(log);
});

export const getSkinLogs = catchAsync(async (req, res) => {
  const logs = await prisma.skinLog.findMany({
    where: { userId: req.user!.id },
    orderBy: { date: 'desc' },
    take: 30,
  });
  res.json(logs);
});

export const upsertTodayLog = catchAsync(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const {
    mood, feelings, concerns, sleepQuality, activityLevel,
    sunExposure, waterGlasses, supplements, periodStatus,
    otherFactors, completedSteps, notes, lifestyleFactors, photoUrl,
  } = req.body;

  const data: Record<string, string | string[] | number | null | undefined> = {};
  if (mood !== undefined) data.mood = mood;
  if (feelings !== undefined) data.feelings = feelings;
  if (concerns !== undefined) data.concerns = concerns;
  if (sleepQuality !== undefined) data.sleepQuality = sleepQuality;
  if (activityLevel !== undefined) data.activityLevel = activityLevel;
  if (sunExposure !== undefined) data.sunExposure = sunExposure;
  if (waterGlasses !== undefined) data.waterGlasses = waterGlasses;
  if (supplements !== undefined) data.supplements = supplements;
  if (periodStatus !== undefined) data.periodStatus = periodStatus;
  if (otherFactors !== undefined) data.otherFactors = otherFactors;
  if (completedSteps !== undefined) data.completedSteps = completedSteps;
  if (notes !== undefined) data.notes = notes;
  if (lifestyleFactors !== undefined) data.lifestyleFactors = lifestyleFactors;
  if (photoUrl !== undefined) data.photoUrl = photoUrl;

  const log = await prisma.skinLog.upsert({
    where: { userId_date: { userId: req.user!.id, date: today } },
    update: data,
    create: { userId: req.user!.id, date: today, ...data },
  });

  res.json(log);
});

export const getTodayLog = catchAsync(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const log = await prisma.skinLog.findUnique({
    where: { userId_date: { userId: req.user!.id, date: today } },
  });

  if (!log) {
    res.status(204).send();
    return;
  }
  res.json(log);
});
