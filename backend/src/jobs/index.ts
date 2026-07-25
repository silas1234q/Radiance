/**
 * Scheduled push jobs (Phase 2). Started once from server.ts.
 *
 * There's no per-user scheduler; instead the jobs run on a fixed server cron and
 * use each user's stored IANA `timezone` (via luxon) to decide whether it's the
 * right local moment for them. Dedupe markers on the User row prevent repeats.
 *
 *   - Weekly summary: runs hourly, fires at ~18:00 local on Sunday.
 *   - Win-back: runs once daily, fires for users inactive ≥ 3 days.
 */
import cron, { ScheduledTask } from 'node-cron';
import { DateTime } from 'luxon';
import prisma from '../config/db.config';
import { sendPushToUsers } from '../services/notificationService';

const WEEKLY_SUMMARY_HOUR = 18; // 6pm local
const WEEKLY_SUMMARY_WEEKDAY = 7; // luxon: Monday=1 … Sunday=7
const WINBACK_INACTIVE_DAYS = 3;
const WINBACK_MIN_GAP_DAYS = 7; // don't nag more than weekly

function localNow(timezone: string | null): DateTime {
  const dt = timezone ? DateTime.now().setZone(timezone) : DateTime.now().setZone('UTC');
  return dt.isValid ? dt : DateTime.now().setZone('UTC');
}

function daysSince(date: Date | null): number {
  if (!date) return Infinity;
  return (Date.now() - date.getTime()) / 86_400_000;
}

/** Count "full days" in the trailing 7 days for a weekly-summary blurb. */
async function weeklyStats(userId: string) {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - 6);

  const completions = await prisma.dailyCompletion.findMany({
    where: { userId, date: { gte: since } },
    select: { isFullDay: true },
  });
  const fullDays = completions.filter((c) => c.isFullDay).length;
  const gamification = await prisma.userGamification.findUnique({ where: { userId } });
  return { fullDays, streak: gamification?.currentStreak ?? 0 };
}

// Prisma's "Can't reach database server" — expected transiently with a
// serverless DB (e.g. Neon auto-suspend). Log tersely instead of a full stack.
function logJobError(label: string, err: unknown): void {
  const code = (err as { code?: string })?.code;
  if (code === 'P1001') {
    console.warn(`[${label}] Database unreachable — skipping this run.`);
  } else {
    console.error(`[${label}] failed:`, err);
  }
}

export async function runWeeklySummaryJob(): Promise<void> {
  let users: {
    id: string;
    expoPushToken: string | null;
    timezone: string | null;
    lastWeeklySummaryAt: Date | null;
  }[];
  try {
    users = await prisma.user.findMany({
      where: {
        pushEnabled: true,
        weeklyProgressEnabled: true,
        expoPushToken: { not: null },
      },
      select: { id: true, expoPushToken: true, timezone: true, lastWeeklySummaryAt: true },
    });
  } catch (err) {
    logJobError('weekly-summary', err);
    return;
  }

  for (const user of users) {
    try {
      const now = localNow(user.timezone);
      if (now.weekday !== WEEKLY_SUMMARY_WEEKDAY || now.hour !== WEEKLY_SUMMARY_HOUR) continue;
      // Already sent within the last few days → skip (guards double-fires).
      if (daysSince(user.lastWeeklySummaryAt) < 3) continue;

      const { fullDays, streak } = await weeklyStats(user.id);
      const body =
        fullDays > 0
          ? `You completed ${fullDays} full ${fullDays === 1 ? 'day' : 'days'} this week${
              streak > 0 ? ` and you're on a ${streak}-day streak 🔥` : ''
            }. See your progress →`
          : "A fresh week to glow up ✨ Open Radiance to restart your routine streak.";

      const sent = await sendPushToUsers(
        [{ userId: user.id, expoPushToken: user.expoPushToken }],
        { title: 'Your weekly skin recap', body, data: { route: '/(tabs)/progress' } },
      );
      if (sent > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastWeeklySummaryAt: new Date() },
        });
      }
    } catch (err) {
      console.error(`[weekly-summary] user ${user.id} failed:`, err);
    }
  }
}

export async function runWinbackJob(): Promise<void> {
  let users: {
    id: string;
    expoPushToken: string | null;
    createdAt: Date;
    lastWinbackAt: Date | null;
  }[];
  try {
    users = await prisma.user.findMany({
      where: {
        pushEnabled: true,
        winbackEnabled: true,
        expoPushToken: { not: null },
      },
      select: {
        id: true,
        expoPushToken: true,
        createdAt: true,
        lastWinbackAt: true,
      },
    });
  } catch (err) {
    logJobError('winback', err);
    return;
  }

  for (const user of users) {
    try {
      // Don't win-back more than once a week.
      if (daysSince(user.lastWinbackAt) < WINBACK_MIN_GAP_DAYS) continue;

      const latest = await prisma.dailyCompletion.findFirst({
        where: { userId: user.id },
        orderBy: { date: 'desc' },
        select: { date: true },
      });

      // Inactive if the last activity (or, for users who never logged, account
      // creation) is at least WINBACK_INACTIVE_DAYS old.
      const lastActivity = latest?.date ?? user.createdAt;
      if (daysSince(lastActivity) < WINBACK_INACTIVE_DAYS) continue;

      const sent = await sendPushToUsers(
        [{ userId: user.id, expoPushToken: user.expoPushToken }],
        {
          title: 'Your skin misses you 💗',
          body: "It's been a few days — a quick routine keeps your progress going.",
          data: { route: '/(tabs)/routine' },
        },
      );
      if (sent > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastWinbackAt: new Date() },
        });
      }
    } catch (err) {
      console.error(`[winback] user ${user.id} failed:`, err);
    }
  }
}

let tasks: ScheduledTask[] = [];

/** Schedule the push jobs. Idempotent — safe to call once at boot. */
export function startJobs(): void {
  if (tasks.length > 0) return;

  // Hourly, on the hour — the per-user timezone check narrows to Sunday 18:00.
  tasks.push(
    cron.schedule('0 * * * *', () => {
      void runWeeklySummaryJob();
    }),
  );

  // Once a day at 12:00 server time — win-back gap logic handles the rest.
  tasks.push(
    cron.schedule('0 12 * * *', () => {
      void runWinbackJob();
    }),
  );

  console.log('[jobs] Push notification jobs scheduled');
}
