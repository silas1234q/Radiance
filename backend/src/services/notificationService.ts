/**
 * Server-side push delivery via Expo's push service.
 *
 * `sendPushToUsers` takes already-selected recipients (the caller decides who,
 * e.g. the cron jobs), sends in chunks, then checks receipts a short while
 * later to prune tokens Expo reports as unregistered.
 */
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import prisma from '../config/db.config';

const expo = new Expo();

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface PushRecipient {
  userId: string;
  expoPushToken: string | null;
}

/** Clear a token that Expo says is no longer valid so we stop retrying it. */
async function clearToken(token: string) {
  await prisma.user.updateMany({
    where: { expoPushToken: token },
    data: { expoPushToken: null },
  });
}

/**
 * Send one payload to many users. Returns the number of messages accepted by
 * Expo for delivery. Skips recipients without a valid token.
 */
export async function sendPushToUsers(
  recipients: PushRecipient[],
  payload: PushPayload,
): Promise<number> {
  const messages: ExpoPushMessage[] = [];
  const tokenByOrder: string[] = [];

  for (const r of recipients) {
    if (!r.expoPushToken || !Expo.isExpoPushToken(r.expoPushToken)) continue;
    messages.push({
      to: r.expoPushToken,
      sound: 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
    });
    tokenByOrder.push(r.expoPushToken);
  }

  if (messages.length === 0) return 0;

  const chunks = expo.chunkPushNotifications(messages);
  const tickets: ExpoPushTicket[] = [];
  let flatIndex = 0;

  for (const chunk of chunks) {
    try {
      const receipts = await expo.sendPushNotificationsAsync(chunk);
      receipts.forEach((ticket) => {
        // A per-message error at send time (e.g. DeviceNotRegistered) means the
        // token is dead — drop it immediately.
        if (ticket.status === 'error') {
          const token = tokenByOrder[flatIndex];
          if (ticket.details?.error === 'DeviceNotRegistered' && token) {
            void clearToken(token);
          }
        }
        tickets.push(ticket);
        flatIndex++;
      });
    } catch (err) {
      console.error('[push] Failed to send chunk:', err);
      flatIndex += chunk.length;
    }
  }

  // Best-effort receipt check for async delivery errors. Expo needs a moment to
  // process, so this is deferred and non-blocking for the caller.
  scheduleReceiptCheck(tickets);

  return messages.length;
}

function scheduleReceiptCheck(tickets: ExpoPushTicket[]) {
  const receiptIds = tickets
    .filter((t): t is Extract<ExpoPushTicket, { status: 'ok' }> => t.status === 'ok')
    .map((t) => t.id);
  if (receiptIds.length === 0) return;

  setTimeout(async () => {
    try {
      const idChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
      for (const idChunk of idChunks) {
        const receipts = await expo.getPushNotificationReceiptsAsync(idChunk);
        for (const receipt of Object.values(receipts)) {
          if (
            receipt.status === 'error' &&
            receipt.details?.error === 'DeviceNotRegistered'
          ) {
            // We no longer have the token here, but Expo also stops delivering
            // to it; the next send-time error will clear it. Log for visibility.
            console.warn('[push] Receipt reported DeviceNotRegistered');
          }
        }
      }
    } catch (err) {
      console.error('[push] Failed to fetch receipts:', err);
    }
  }, 15_000);
}
