import { catchAsync } from '../utils/catchAsync';
import prisma from '../config/db.config';
import { getAuth, clerkClient } from '@clerk/express';
import { invalidateUserCache } from '../middleware/syncUser';
import { Expo } from 'expo-server-sdk';
import { sendPushToUsers } from '../services/notificationService';

export const getMe = catchAsync(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { skinProfile: true },
  });
  res.json(user);
});

export const updateMe = catchAsync(async (req, res) => {
  const { firstName, lastName, avatarUrl } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(avatarUrl !== undefined && { avatarUrl }),
    },
  });

  const auth = getAuth(req);
  if (auth?.userId) invalidateUserCache(auth.userId);

  res.json(user);
});

// PUT /users/me/push-token — register/refresh the device's Expo push token and
// server-push preferences. All fields optional; only provided keys are updated.
// Passing token: null clears the token (e.g. on logout / permission revoked).
export const updatePushToken = catchAsync(async (req, res) => {
  const { token, timezone, pushEnabled, weeklyProgressEnabled, winbackEnabled } = req.body;

  const data: {
    expoPushToken?: string | null;
    timezone?: string;
    pushEnabled?: boolean;
    weeklyProgressEnabled?: boolean;
    winbackEnabled?: boolean;
  } = {};

  if (token !== undefined) {
    // Reject malformed tokens rather than storing junk we'd fail to send to.
    if (token !== null && !Expo.isExpoPushToken(token)) {
      res.status(400).json({ success: false, type: 'VALIDATION', message: 'Invalid Expo push token' });
      return;
    }
    data.expoPushToken = token;
  }
  if (typeof timezone === 'string' && timezone.length > 0) data.timezone = timezone;
  if (pushEnabled !== undefined) data.pushEnabled = !!pushEnabled;
  if (weeklyProgressEnabled !== undefined) data.weeklyProgressEnabled = !!weeklyProgressEnabled;
  if (winbackEnabled !== undefined) data.winbackEnabled = !!winbackEnabled;

  const user = await prisma.user.update({ where: { id: req.user!.id }, data });

  const auth = getAuth(req);
  if (auth?.userId) invalidateUserCache(auth.userId);

  res.json({ success: true });
});

// POST /users/me/test-push — dev-only helper to send a push to the current
// user's device so you can verify delivery without waiting for a cron job.
// Guarded by ENABLE_TEST_PUSH=1; returns 404 otherwise so it can't ship live.
export const sendTestPush = catchAsync(async (req, res) => {
  if (process.env.ENABLE_TEST_PUSH !== '1') {
    res.status(404).json({ success: false, type: 'NOT_FOUND', message: 'Not found' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, expoPushToken: true },
  });
  if (!user?.expoPushToken) {
    res.status(400).json({
      success: false,
      type: 'VALIDATION',
      message: 'No push token registered for this user yet.',
    });
    return;
  }

  const sent = await sendPushToUsers([{ userId: user.id, expoPushToken: user.expoPushToken }], {
    title: 'Radiance test push 🔔',
    body: 'If you can see this, server push is working.',
    data: { route: '/(tabs)/progress' },
  });

  res.json({ success: true, sent });
});

export const deleteMe = catchAsync(async (req, res) => {
  const userId = req.user!.id;
  const auth = getAuth(req);

  // Remove the DB user and everything owned by them. Most relations cascade
  // from User, but RoutineInsightCache is keyed by userId without an FK
  // relation, so it must be deleted explicitly.
  await prisma.$transaction(
    async (tx) => {
      await tx.routineInsightCache.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    },
    { maxWait: 10000, timeout: 20000 },
  );

  if (auth?.userId) {
    invalidateUserCache(auth.userId);
    // Best-effort removal of the Clerk auth account so the user can't sign
    // back into a now-deleted profile. DB data is already gone regardless.
    try {
      await clerkClient.users.deleteUser(auth.userId);
    } catch (err) {
      console.warn('[deleteMe] Failed to delete Clerk user:', err);
    }
  }

  res.status(204).send();
});
