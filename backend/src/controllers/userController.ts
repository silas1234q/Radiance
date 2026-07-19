import { catchAsync } from '../utils/catchAsync';
import prisma from '../config/db.config';
import { getAuth } from '@clerk/express';
import { invalidateUserCache } from '../middleware/syncUser';

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
