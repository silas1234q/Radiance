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

  const avatarUrl = clerkUser.imageUrl ?? null;
  const userData = {
    clerkId,
    email: primaryEmail,
    firstName: clerkUser.firstName || null,
    lastName: clerkUser.lastName || null,
    avatarUrl,
  };

  const user = await prisma.user.upsert({
    where: { clerkId },
    update: userData,
    create: userData,
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
