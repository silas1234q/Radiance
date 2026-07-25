import { Router, raw } from 'express';
import { Webhook } from 'svix';
import prisma from '../config/db.config';
import { invalidateUserCache } from '../middleware/syncUser';

const router = Router();

router.post(
  '/clerk',
  raw({ type: 'application/json' }),
  async (req, res) => {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    if (!WEBHOOK_SECRET) {
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    const svixId = req.headers['svix-id'] as string;
    const svixTimestamp = req.headers['svix-timestamp'] as string;
    const svixSignature = req.headers['svix-signature'] as string;

    if (!svixId || !svixTimestamp || !svixSignature) {
      return res.status(400).json({ error: 'Missing svix headers' });
    }

    const wh = new Webhook(WEBHOOK_SECRET);
    interface WebhookEvent {
      type: string;
      data: {
        id: string;
        first_name?: string | null;
        last_name?: string | null;
        email_addresses?: Array<{ email_address: string }>;
        image_url?: string | null;
      };
    }
    let evt: WebhookEvent;

    try {
      evt = wh.verify(req.body, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as unknown as WebhookEvent;
    } catch {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const { type, data } = evt;

    try {
      if (type === 'user.created' || type === 'user.updated') {
        const firstName = data.first_name || null;
        const lastName = data.last_name || null;
        const email = data.email_addresses?.[0]?.email_address || `${data.id}@placeholder.com`;
        const avatarUrl = data.image_url || null;

        await prisma.user.upsert({
          where: { clerkId: data.id },
          // Avatar is managed in-app (PATCH /users/me); only seed it from Clerk
          // on create so a Clerk profile update doesn't clobber a custom avatar.
          update: { firstName, lastName, email },
          create: { clerkId: data.id, firstName, lastName, email, avatarUrl },
        });
      } else if (type === 'user.deleted') {
        await prisma.user.deleteMany({ where: { clerkId: data.id } });
        invalidateUserCache(data.id);
      }
    } catch (error) {
      console.error('Webhook processing error:', error);
      return res.status(500).json({ error: 'Webhook processing failed' });
    }

    res.json({ received: true });
  }
);

export default router;
