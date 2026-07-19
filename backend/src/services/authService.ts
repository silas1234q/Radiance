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

  // Auto-detect onboarded users: if they have a skin profile in DB but Clerk
  // metadata is missing (e.g. after switching Clerk to production), set it.
  const hasSkinProfile = await prisma.skinProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (hasSkinProfile && !clerkUser.publicMetadata?.onboarded) {
    clerkClient.users.updateUserMetadata(clerkId, {
      publicMetadata: { onboarded: true },
    }).catch(() => {}); // fire-and-forget
  }

  return user;
};
