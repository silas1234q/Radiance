import { clerkMiddleware, getAuth } from '@clerk/express';
import { Request, Response, NextFunction } from 'express';

export const clerkAuth = clerkMiddleware();

export const requireAuth = () => (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) {
      res.status(401).json({ success: false, type: 'UNAUTHORIZED', message: 'Unauthorized' });
      return;
    }
    next();
  } catch (err) {
    console.error('requireAuth error:', err);
    res.status(401).json({ success: false, type: 'UNAUTHORIZED', message: 'Unauthorized' });
  }
};
