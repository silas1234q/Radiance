import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { User } from '../../generated/prisma/client';
import prisma from '../config/db.config';

const userCache = new Map<string, { user: User; expiry: number }>();
const CACHE_TTL = 60_000; // 60 seconds

export function invalidateUserCache(clerkId: string) {
  userCache.delete(clerkId);
}

export const syncUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) {
      res.status(401).json({ success: false, type: 'UNAUTHORIZED', message: 'Unauthorized' });
      return;
    }

    const cached = userCache.get(auth.userId);
    if (cached && cached.expiry > Date.now()) {
      req.user = cached.user;
      return next();
    }

    const user = await prisma.user.findUnique({ where: { clerkId: auth.userId } });
    if (!user) {
      res.status(401).json({ success: false, type: 'UNAUTHORIZED', message: 'User not synced. Call POST /api/auth/sync first.' });
      return;
    }

    userCache.set(auth.userId, { user, expiry: Date.now() + CACHE_TTL });
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
