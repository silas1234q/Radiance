import { catchAsync } from '../utils/catchAsync';
import prisma from '../config/db.config';
import AppError from '../errors/AppError';

const RC_SECRET = process.env.REVENUECAT_SECRET_KEY;
const RC_API_BASE = 'https://api.revenuecat.com/v1';

/**
 * Verify a consumable scan-credit purchase via RevenueCat and credit the user.
 * POST /api/scan-credits/verify-purchase
 * Body: { transactionId: string }
 */
export const verifyPurchase = catchAsync(async (req, res) => {
  const userId = req.user!.id;
  const { transactionId } = req.body;

  if (!transactionId || typeof transactionId !== 'string') {
    throw new AppError({ message: 'transactionId is required', statusCode: 400, type: 'VALIDATION_ERROR' });
  }

  // Idempotency: if this transaction was already credited, return current balance
  const existing = await prisma.scanCredit.findUnique({ where: { transactionId } });
  if (existing) {
    const availableCredits = await prisma.scanCredit.count({ where: { userId, usedAt: null } });
    return res.json({ credits: availableCredits });
  }

  // Verify with RevenueCat that this transaction belongs to this user
  if (RC_SECRET) {
    const clerkId = req.user!.clerkId;
    try {
      const rcRes = await fetch(
        `${RC_API_BASE}/subscribers/${encodeURIComponent(clerkId)}`,
        { headers: { Authorization: `Bearer ${RC_SECRET}`, 'Content-Type': 'application/json' } },
      );

      if (!rcRes.ok) {
        throw new AppError({ message: 'Unable to verify purchase', statusCode: 502, type: 'EXTERNAL_SERVICE_ERROR' });
      }

      const data = (await rcRes.json()) as {
        subscriber?: {
          non_subscriptions?: Record<string, Array<{ id: string; store_transaction_id: string }>>;
        };
      };

      // Search through all non-subscription (consumable) purchases for the transaction
      const allPurchases = Object.values(data.subscriber?.non_subscriptions ?? {}).flat();
      const found = allPurchases.some(
        (p) => p.id === transactionId || p.store_transaction_id === transactionId,
      );

      if (!found) {
        throw new AppError({ message: 'Transaction not found for this user', statusCode: 403, type: 'FORBIDDEN' });
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      console.warn('[ScanCredits] RevenueCat verification error', err);
      throw new AppError({ message: 'Unable to verify purchase', statusCode: 502, type: 'EXTERNAL_SERVICE_ERROR' });
    }
  }

  // Credit the user
  await prisma.scanCredit.create({
    data: { userId, transactionId },
  });

  const availableCredits = await prisma.scanCredit.count({ where: { userId, usedAt: null } });
  res.json({ credits: availableCredits });
});

/**
 * Get the user's scan credit balance and free scan info.
 * GET /api/scan-credits
 */
export const getScanCredits = catchAsync(async (req, res) => {
  const userId = req.user!.id;

  const [availableCredits, profile] = await Promise.all([
    prisma.scanCredit.count({ where: { userId, usedAt: null } }),
    prisma.skinProfile.findUnique({
      where: { userId },
      select: { faceScanWeekStart: true, faceScanCountThisWeek: true },
    }),
  ]);

  let freeScansRemaining = 2;
  let weekResetsAt: string | null = null;

  if (profile?.faceScanWeekStart) {
    const windowEnd = new Date(profile.faceScanWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (new Date() < windowEnd) {
      freeScansRemaining = Math.max(0, 2 - profile.faceScanCountThisWeek);
      weekResetsAt = windowEnd.toISOString();
    }
    // Window expired → full free scans available, no reset needed
  }

  res.json({ availableCredits, freeScansRemaining, weekResetsAt });
});
