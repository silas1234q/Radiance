import { clerkClient } from '@clerk/express';
import prisma from '../config/db.config';
import AuthError from '../errors/AuthError';
import { invalidateUserCache } from '../middleware/syncUser';

export const authService = async (clerkId: string) => {
  let clerkUser;
  try {
    clerkUser = await clerkClient.users.getUser(clerkId);
  } catch {
    throw new AuthError('user not authenticated');
  }

  const primaryEmail = clerkUser.primaryEmailAddress?.emailAddress;
  if (!primaryEmail) throw new AuthError('user email not found');

  const baseData = {
    clerkId,
    email: primaryEmail,
    firstName: clerkUser.firstName || null,
    lastName: clerkUser.lastName || null,
  };

  const user = await prisma.user.upsert({
    where: { clerkId },
    // Don't overwrite the user's avatar on every sync — the avatar is managed
    // in-app (PATCH /users/me). Only seed it from Clerk when first creating the
    // account.
    update: baseData,
    create: { ...baseData, avatarUrl: clerkUser.imageUrl ?? null },
  });

  invalidateUserCache(clerkId);

  const hasQuizAnswers = await prisma.skinQuizAnswer.findFirst({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!hasQuizAnswers && clerkUser.publicMetadata?.onboarded) {
    clerkClient.users.updateUserMetadata(clerkId, {
      publicMetadata: { onboarded: null },
    }).catch(() => {});
  }

  return { user, isOnboarded: !!hasQuizAnswers };
};
