import { catchAsync } from '../utils/catchAsync';
import { getAuth, clerkClient } from '@clerk/express';
import type { Request } from 'express';
import prisma from '../config/db.config';
import AppError from '../errors/AppError';
import {
  analyzeSkin,
  analyzeSkinWithScan,
  type AnalysisResult,
} from '../services/skinAnalysisService';
import { generateRoutines } from '../services/routineService';
import { generateWeeklyPlan, getOrGenerateWeeklyPlan } from '../services/weeklyPlanService';
import * as revenueCatService from '../services/revenueCatService';
import { deleteFromCloudinary } from '../services/uploadService';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function getWeekNumber(): number {
  const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime();
  return Math.ceil((Date.now() - startOfYear) / WEEK_MS) || 1;
}

function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function toJson(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Routines are a paid ("Radiance Pro") feature. Decide whether to generate them
 * for this request. When RevenueCat is configured we verify the entitlement
 * server-side (authoritative, tamper-proof) and ignore the client. Otherwise we
 * fall back to the client's `buildRoutine` hint so local/dev setups still work.
 */
async function shouldBuildRoutine(req: Request): Promise<boolean> {
  if (revenueCatService.isConfigured()) {
    const auth = getAuth(req);
    return auth?.userId ? revenueCatService.hasProEntitlement(auth.userId) : false;
  }
  return req.body?.buildRoutine !== false;
}

type ScoreInput = Pick<
  AnalysisResult,
  'skinScore' | 'hydration' | 'oilBalance' | 'texture' | 'evenTone' | 'sensitivity'
>;

async function upsertSkinScore(userId: string, analysis: ScoreInput): Promise<void> {
  const date = todayStart();
  const metrics = {
    score: analysis.skinScore,
    hydration: analysis.hydration,
    oilBalance: analysis.oilBalance,
    texture: analysis.texture,
    evenTone: analysis.evenTone,
    sensitivity: analysis.sensitivity,
  };

  await prisma.skinScore.upsert({
    where: { userId_date: { userId, date } },
    update: metrics,
    create: { userId, week: getWeekNumber(), date, ...metrics },
  });
}

/** Routines + weekly plan (Pro only) and the Clerk "onboarded" flag. Shared by both analyze endpoints. */
async function finishOnboarding(req: Request, userId: string, buildRoutine: boolean): Promise<void> {
  if (buildRoutine) {
    await generateRoutines(userId);

    // Generate weekly plan in background (don't block response)
    generateWeeklyPlan(userId).catch((err: unknown) =>
      console.error('Background weekly plan generation failed:', err),
    );
  }

  const auth = getAuth(req);
  if (auth?.userId) {
    await clerkClient.users.updateUserMetadata(auth.userId, {
      publicMetadata: { onboarded: true },
    });
  }
}

export const getSkinProfile = catchAsync(async (req, res) => {
  const profile = await prisma.skinProfile.findUnique({
    where: { userId: req.user!.id },
  });
  res.json(profile);
});

const PROFILE_FIELDS = [
  'skinType',
  'sensitivityLevel',
  'skinTone',
  'concerns',
  'allergies',
  'routineLength',
  'productBudget',
  'ingredientsToAvoid',
] as const;

export const createSkinProfile = catchAsync(async (req, res) => {
  const userId = req.user!.id;
  const body = (req.body ?? {}) as Record<string, unknown>;

  // Whitelist fields and drop undefined keys
  const data = Object.fromEntries(
    PROFILE_FIELDS.filter((key) => body[key] !== undefined).map((key) => [key, body[key]]),
  ) 

  const profile = await prisma.skinProfile.upsert({
    where: { userId },
    update: data,
    create: { userId, ...(data) },
  });
  res.json(profile);
});

export const analyzeWithScan = catchAsync(async (req, res) => {
  const userId = req.user!.id;
  const { photoUrl } = req.body as { photoUrl?: unknown };

  if (!photoUrl || typeof photoUrl !== 'string') {
    throw new AppError({ message: 'photoUrl is required', statusCode: 400, type: 'VALIDATION_ERROR' });
  }

  const existingProfile = await prisma.skinProfile.findUnique({ where: { userId } });
  const now = new Date();

  // Rolling 7-day window for face scans
  const weekStart = existingProfile?.faceScanWeekStart ?? null;
  const windowStillOpen = weekStart !== null && now.getTime() - weekStart.getTime() < WEEK_MS;
  const scansThisWeek = windowStillOpen ? (existingProfile?.faceScanCountThisWeek ?? 0) : 0;

  // Enforce 2 face scans per window; purchased credits extend the limit
  if (windowStillOpen && scansThisWeek >= 2) {
    const availableCredit = await prisma.scanCredit.findFirst({
      where: { userId, usedAt: null },
      orderBy: { purchasedAt: 'asc' },
    });
    if (!availableCredit) {
      throw new AppError({
        message: 'You can only scan your face twice per week. Try again later.',
        statusCode: 429,
        type: 'RATE_LIMIT',
      });
    }
    // Consume the oldest available credit
    await prisma.scanCredit.update({
      where: { id: availableCredit.id },
      data: { usedAt: now },
    });
  }

  const faceScanWeekStart = windowStillOpen && weekStart ? weekStart : now;
  const faceScanCountThisWeek = scansThisWeek + 1;

  const analysis = await analyzeSkinWithScan(userId, photoUrl);

  // Pull out metadata and AI-only text fields; the rest maps onto the profile.
  const {
    _raw,
    _source,
    _scanData,
    summary: _summary,
    scanMetricExplanations: _scanMetricExplanations,
    concerns,
    allergies,
    skinType,
    sensitivityLevel,
    skinTone,
    ...scanDerivedData
  } = analysis;

  const scanMeta = {
    photoUrl,
    aiAnalysisRaw: _raw ? toJson(_raw) : undefined,
    analysisSource: _source,
    scanData: _scanData ? toJson(_scanData) : undefined,
    lastFaceScanAt: now,
    faceScanWeekStart,
    faceScanCountThisWeek,
  };

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
      // Keep the first scan as the immutable baseline ("before" photo).
      baselinePhotoUrl: existingProfile?.baselinePhotoUrl ?? photoUrl,
      ...scanMeta,
    },
    create: {
      userId,
      ...scanDerivedData,
      concerns,
      allergies,
      skinType,
      sensitivityLevel,
      skinTone,
      baselinePhotoUrl: photoUrl,
      ...scanMeta,
    },
  });

  // Retention: keep the baseline ("before") photo and the current scan, nothing
  // else. Each scan uploads a fresh asset, so without this the superseded ones
  // would pile up in Cloudinary indefinitely.
  const supersededPhoto = existingProfile?.photoUrl;
  if (
    supersededPhoto &&
    supersededPhoto !== photoUrl &&
    supersededPhoto !== profile.baselinePhotoUrl
  ) {
    await deleteFromCloudinary([supersededPhoto]);
  }

  await upsertSkinScore(userId, analysis);

  // Routines are Radiance Pro only — verified server-side
  await finishOnboarding(req, userId, await shouldBuildRoutine(req));

  res.json(profile);
});

export const analyzeProfile = catchAsync(async (req, res) => {
  const userId = req.user!.id;
  // Routines are a paid ("Radiance Pro") feature — verified server-side.
  const buildRoutine = await shouldBuildRoutine(req);

  // Quiz-only result: no scores, skin age or face map. The full result
  // (summary, skincarePriorities, ...) is kept in aiAnalysisRaw.
  const { _source, ...analysis } = await analyzeSkin(userId);

  const profileFields = {
    skinType: analysis.skinType,
    sensitivityLevel: analysis.sensitivityLevel,
    concerns: analysis.concerns,
    allergies: analysis.allergies,
    aiAnalysisRaw: analysis,
    analysisSource: _source,
  };

  const profile = await prisma.skinProfile.upsert({
    where: { userId },
    update: profileFields,
    create: { userId, ...profileFields },
  });

  await finishOnboarding(req, userId, buildRoutine);

  res.json({...profile,});
});

export const getWeeklyPlanController = catchAsync(async (req, res) => {
  const result = await getOrGenerateWeeklyPlan(req.user!.id);
  res.json(result);
});