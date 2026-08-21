import { clerkMiddleware, getAuth } from '@clerk/express';
import { Request, Response, NextFunction } from 'express';

export const clerkAuth = clerkMiddleware();

/**
 * A 401 here is indistinguishable from an expired session on the client, which
 * signs the user out — so when the token is rejected we log *why*. Clerk's
 * `auth.debug()` reports the reason (`token-invalid`, `token-expired`,
 * `secret-key-invalid`, issuer mismatch) alongside the first 7 characters of the
 * configured secret key, which is enough to see `sk_test` where `sk_live` was
 * expected. Clerk truncates those fields itself; nothing secret is logged.
 */
export const requireAuth = () => (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) {
      const debug = (auth as { debug?: () => Record<string, unknown> } | undefined)?.debug;
      console.warn('requireAuth 401:', {
        path: req.originalUrl,
        hasAuthHeader: !!req.headers.authorization,
        ...(typeof debug === 'function' ? debug() : {}),
      });
      res.status(401).json({ success: false, type: 'UNAUTHORIZED', message: 'Unauthorized' });
      return;
    }
    next();
  } catch (err) {
    console.error('requireAuth error:', err);
    res.status(401).json({ success: false, type: 'UNAUTHORIZED', message: 'Unauthorized' });
  }
};
