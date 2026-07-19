import { catchAsync } from '../utils/catchAsync';
import { getAuth } from '@clerk/express';
import { clerkClient } from '@clerk/express';
import prisma from '../config/db.config';
import AppError from '../errors/AppError';
import { analyzeSkin, analyzeSkinWithScan } from '../services/skinAnalysisService';
import { generateRoutines } from '../services/routineService';
import { generateWeeklyPlan, getOrGenerateWeeklyPlan } from '../services/weeklyPlanService';

function getWeekNumber(): number {
  return Math.ceil((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)) || 1;
}

function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function upsertSkinScore(userId: string, analysis: { skinScore: number; hydration?: number; oilBalance?: number; texture?: number; evenTone?: number; sensitivity?: number }) {
  const week = getWeekNumber();
  const date = todayStart();
  await prisma.skinScore.upsert({
    where: { userId_date: { userId, date } },
    update: {
      score: analysis.skinScore,
      hydration: analysis.hydration,
      oilBalance: analysis.oilBalance,
      texture: analysis.texture,
      evenTone: analysis.evenTone,
      sensitivity: analysis.sensitivity,
    },
    create: {
      userId,
      score: analysis.skinScore,
      week,
      date,
      hydration: analysis.hydration,
      oilBalance: analysis.oilBalance,
      texture: analysis.texture,
      evenTone: analysis.evenTone,
      sensitivity: analysis.sensitivity,
    },
  });
}

export const getSkinProfile = catchAsync(async (req, res) => {
  const profile = await prisma.skinProfile.findUnique({
    where: { userId: req.user!.id },
  });
  res.json(profile);
});

export const createSkinProfile = catchAsync(async (req, res) => {
  const { skinType, sensitivityLevel, skinTone, concerns, allergies } = req.body;
  const allowed = { skinType, sensitivityLevel, skinTone, concerns, allergies };
  // Remove undefined keys
  const data = Object.fromEntries(Object.entries(allowed).filter(([, v]) => v !== undefined));

  const profile = await prisma.skinProfile.upsert({
    where: { userId: req.user!.id },
    update: data,
    create: { userId: req.user!.id, ...data },
  });
  res.json(profile);
});

export const analyzeWithScan = catchAsync(async (req, res) => {
  const userId = req.user!.id;
  const { photoUrl } = req.body;

  if (!photoUrl || typeof photoUrl !== 'string') {
    throw new AppError('photoUrl is required', 400, 'VALIDATION_ERROR');
  }

  // Validate DB access before calling expensive external APIs
  await prisma.skinQuizAnswer.findFirst({ where: { userId } });

  const existingProfile = await prisma.skinProfile.findUnique({ where: { userId } });

  const analysis = await analyzeSkinWithScan(userId, photoUrl);

  const { _raw, _source, _scanData, ...profileData } = analysis;

  // Separate user-chosen fields from scan-derived fields
  const { concerns, allergies, skinType, sensitivityLevel, skinTone, ...scanDerivedData } = profileData;

  const profile = await prisma.skinProfile.upsert({
    where: { userId },
    update: {
      ...scanDerivedData,
      // Preserve user-chosen fields if they already exist
      concerns: existingProfile?.concerns ?? concerns,
      allergies: existingProfile?.allergies ?? allergies,
      skinType: existingProfile?.skinType ?? skinType,
      sensitivityLevel: existingProfile?.sensitivityLevel ?? sensitivityLevel,
      skinTone: existingProfile?.skinTone ?? skinTone,
      photoUrl,
      aiAnalysisRaw: _raw ? JSON.parse(JSON.stringify(_raw)) : undefined,
      analysisSource: _source ?? undefined,
      scanData: _scanData ? JSON.parse(JSON.stringify(_scanData)) : undefined,
    },
    create: {
      userId,
      ...profileData,
      photoUrl,
      aiAnalysisRaw: _raw ? JSON.parse(JSON.stringify(_raw)) : undefined,
      analysisSource: _source ?? undefined,
      scanData: _scanData ? JSON.parse(JSON.stringify(_scanData)) : undefined,
    },
  });

  await upsertSkinScore(userId, analysis);

  // Generate routines
  await generateRoutines(userId);

  // Generate weekly plan in background (don't block response)
  generateWeeklyPlan(userId).catch((err) =>
    console.error("Background weekly plan generation failed:", err),
  );

  // Mark user as onboarded in Clerk
  const auth = getAuth(req);
  if (auth?.userId) {
    await clerkClient.users.updateUserMetadata(auth.userId, {
      publicMetadata: { onboarded: true },
    });
  }

  res.json(profile);
});

export const analyzeProfile = catchAsync(async (req, res) => {
  const userId = req.user!.id;
  const analysis = await analyzeSkin(userId);

  const { _raw, _source, _scanData, ...profileData } = analysis;

  const profile = await prisma.skinProfile.upsert({
    where: { userId },
    update: {
      ...profileData,
      aiAnalysisRaw: _raw ? JSON.parse(JSON.stringify(_raw)) : undefined,
      analysisSource: _source ?? undefined,
    },
    create: {
      userId,
      ...profileData,
      aiAnalysisRaw: _raw ? JSON.parse(JSON.stringify(_raw)) : undefined,
      analysisSource: _source ?? undefined,
    },
  });

  await upsertSkinScore(userId, analysis);

  // Generate routines
  await generateRoutines(userId);

  // Generate weekly plan in background (don't block response)
  generateWeeklyPlan(userId).catch((err) =>
    console.error("Background weekly plan generation failed:", err),
  );

  // Mark user as onboarded in Clerk
  const auth = getAuth(req);
  if (auth?.userId) {
    await clerkClient.users.updateUserMetadata(auth.userId, {
      publicMetadata: { onboarded: true },
    });
  }

  res.json(profile);
});

export const getWeeklyPlanController = catchAsync(async (req, res) => {
  const result = await getOrGenerateWeeklyPlan(req.user!.id);
  res.json(result);
});
