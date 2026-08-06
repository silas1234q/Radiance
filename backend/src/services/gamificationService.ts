import prisma from '../config/db.config';

const XP_TABLE: Record<string, number> = {
  COMPLETE_AM: 50,
  COMPLETE_PM: 50,
  COMPLETE_CUSTOM: 50,
  LOG_MOOD: 15,
  DAILY_BONUS: 30,
  STREAK_MILESTONE: 100,
};

interface GlowLevel {
  level: number;
  label: string;
  minXp: number;
  maxXp: number;
}

const GLOW_LEVELS: GlowLevel[] = [
  { level: 1, label: 'Seedling', minXp: 0, maxXp: 499 },
  { level: 2, label: 'Emerging', minXp: 500, maxXp: 1499 },
  { level: 3, label: 'Glowing', minXp: 1500, maxXp: 3499 },
  { level: 4, label: 'Radiant', minXp: 3500, maxXp: 6999 },
  { level: 5, label: 'Luminous', minXp: 7000, maxXp: Infinity },
];

function getGlowLevel(totalXp: number) {
  const level = GLOW_LEVELS.find((l) => totalXp >= l.minXp && totalXp <= l.maxXp) ?? GLOW_LEVELS[0];
  const nextLevel = GLOW_LEVELS.find((l) => l.level === level.level + 1);
  return {
    level: level.level,
    label: level.label,
    currentXp: totalXp,
    levelMinXp: level.minXp,
    levelMaxXp: nextLevel ? nextLevel.minXp : level.minXp,
  };
}

function getTodayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function getYesterdayMidnight(): Date {
  const d = getTodayMidnight();
  d.setDate(d.getDate() - 1);
  return d;
}

/** How far back a client is allowed to date a completion. */
const MAX_BACKDATE_MS = 48 * 60 * 60 * 1000;
/** Tolerance for a client clock running slightly fast. */
const CLOCK_SKEW_MS = 5 * 60 * 1000;

/**
 * Resolves when a completion actually happened.
 *
 * The app queues routine/mood writes while offline and replays them on
 * reconnect, which can be after midnight — so the client sends `occurredAt`,
 * the moment the user tapped, and we credit that day rather than the day the
 * request finally arrived. Clamped to the last 48 hours and never meaningfully
 * in the future, so a client can't backfill arbitrary streaks.
 *
 * Returns both the instant (for `completedAt` timestamps) and its midnight
 * (for the `DailyCompletion` / `XpEvent` day bucket).
 */
export function resolveOccurrence(occurredAt?: string | null): { at: Date; day: Date } {
  const now = new Date();

  if (occurredAt) {
    const parsed = new Date(occurredAt);
    const valid =
      !Number.isNaN(parsed.getTime()) &&
      parsed.getTime() <= now.getTime() + CLOCK_SKEW_MS &&
      now.getTime() - parsed.getTime() <= MAX_BACKDATE_MS;

    if (valid) {
      const at = parsed.getTime() > now.getTime() ? now : parsed;
      const day = new Date(at);
      day.setHours(0, 0, 0, 0);
      return { at, day };
    }
  }

  return { at: now, day: getTodayMidnight() };
}

export async function ensureGamification(userId: string) {
  return prisma.userGamification.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

export async function awardXp(userId: string, action: string, xpAmount: number, date: Date) {
  // Skip if this exact action was already awarded today
  const existing = await prisma.xpEvent.findFirst({
    where: { userId, action, date },
  });
  if (existing) return existing;

  const gamification = await ensureGamification(userId);

  const [event] = await Promise.all([
    prisma.xpEvent.create({
      data: { userId, action, xp: xpAmount, date },
    }),
    prisma.userGamification.update({
      where: { userId },
      data: { totalXp: gamification.totalXp + xpAmount },
    }),
  ]);

  return event;
}

export async function updateDailyCompletion(
  userId: string,
  field: 'amCompleted' | 'pmCompleted' | 'customCompleted' | 'moodLogged',
  // Defaults to today; a queued offline write passes the day it was made.
  day: Date = getTodayMidnight(),
) {
  const today = day;

  const completion = await prisma.dailyCompletion.upsert({
    where: { userId_date: { userId, date: today } },
    create: { userId, date: today, [field]: true },
    update: { [field]: true },
  });

  // Check if the day now counts as a full day. A user's routine obligation is
  // met either by completing both AM and PM routines, or — for users who only
  // keep a custom routine — by completing a custom routine. Either way a mood
  // (skin) log is still required.
  const updated = await prisma.dailyCompletion.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  const routineDone =
    !!updated && ((updated.amCompleted && updated.pmCompleted) || updated.customCompleted);

  if (updated && routineDone && updated.moodLogged && !updated.isFullDay) {
    await prisma.dailyCompletion.update({
      where: { userId_date: { userId, date: today } },
      data: { isFullDay: true },
    });

    // Award daily bonus
    await awardXp(userId, 'DAILY_BONUS', XP_TABLE.DAILY_BONUS, today);

    // Update streak
    await updateStreak(userId, today);
  }

  return completion;
}

async function updateStreak(userId: string, day: Date = getTodayMidnight()) {
  const gamification = await ensureGamification(userId);
  const today = day;
  const yesterday = new Date(day);
  yesterday.setDate(yesterday.getDate() - 1);

  let newStreak = gamification.currentStreak;

  if (gamification.lastCompletionDate) {
    const lastDate = new Date(gamification.lastCompletionDate);
    lastDate.setHours(0, 0, 0, 0);

    if (lastDate.getTime() >= today.getTime()) {
      // Already counted for this day — or for a later one, which happens when a
      // queued offline completion replays after the streak has already moved on.
      return;
    } else if (lastDate.getTime() === yesterday.getTime()) {
      // Consecutive day
      newStreak = gamification.currentStreak + 1;
    } else {
      // Gap — streak broken
      newStreak = 1;
    }
  } else {
    newStreak = 1;
  }

  const newLongest = Math.max(gamification.longestStreak, newStreak);

  await prisma.userGamification.update({
    where: { userId },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastCompletionDate: today,
    },
  });

  // Streak milestone bonus every 7 days
  if (newStreak > 0 && newStreak % 7 === 0) {
    await awardXp(userId, 'STREAK_MILESTONE', XP_TABLE.STREAK_MILESTONE, today);
  }
}

export async function restoreStreak(userId: string) {
  const gamification = await ensureGamification(userId);

  if (gamification.streakRestoresLeft <= 0) {
    return { success: false, reason: 'No streak restores remaining' };
  }

  const today = getTodayMidnight();
  const yesterday = getYesterdayMidnight();
  const twoDaysAgo = new Date(yesterday);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 1);

  if (!gamification.lastCompletionDate) {
    return { success: false, reason: 'No streak to restore' };
  }

  const lastDate = new Date(gamification.lastCompletionDate);
  lastDate.setHours(0, 0, 0, 0);

  // Can only restore if exactly 1 day was missed (last completion was 2 days ago)
  if (lastDate.getTime() !== twoDaysAgo.getTime()) {
    return { success: false, reason: 'Can only restore a streak broken by exactly one missed day' };
  }

  await prisma.userGamification.update({
    where: { userId },
    data: {
      streakRestoresLeft: gamification.streakRestoresLeft - 1,
      lastCompletionDate: yesterday, // backfill to yesterday
    },
  });

  return {
    success: true,
    streakRestoresLeft: gamification.streakRestoresLeft - 1,
    currentStreak: gamification.currentStreak,
  };
}

export async function getGamificationSummary(userId: string) {
  const gamification = await ensureGamification(userId);
  const glowLevel = getGlowLevel(gamification.totalXp);

  // Determine if streak can be restored
  const today = getTodayMidnight();
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  let canRestoreStreak = false;
  if (gamification.lastCompletionDate && gamification.streakRestoresLeft > 0) {
    const lastDate = new Date(gamification.lastCompletionDate);
    lastDate.setHours(0, 0, 0, 0);
    canRestoreStreak = lastDate.getTime() === twoDaysAgo.getTime();
  }

  return {
    totalXp: gamification.totalXp,
    glowLevel,
    currentStreak: gamification.currentStreak,
    longestStreak: gamification.longestStreak,
    streakRestoresLeft: gamification.streakRestoresLeft,
    canRestoreStreak,
  };
}

export async function getXpHistory(userId: string, days: number = 30) {
  await ensureGamification(userId);

  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - days + 1);

  const events = await prisma.xpEvent.findMany({
    where: {
      userId,
      date: { gte: startDate },
    },
    orderBy: { date: 'asc' },
  });

  // Get total XP earned before the window so we can compute cumulative
  const priorEvents = await prisma.xpEvent.findMany({
    where: {
      userId,
      date: { lt: startDate },
    },
    select: { xp: true },
  });
  let cumulativeXp = priorEvents.reduce((sum, e) => sum + e.xp, 0);

  // Aggregate by day and build cumulative series
  const dailyMap = new Map<string, number>();
  for (const event of events) {
    const d = new Date(event.date);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString();
    dailyMap.set(key, (dailyMap.get(key) ?? 0) + event.xp);
  }

  const result: { date: string; dailyXp: number; totalXp: number }[] = [];
  const today = getTodayMidnight();

  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    if (d > today) break;

    const key = d.toISOString();
    const dailyXp = dailyMap.get(key) ?? 0;
    cumulativeXp += dailyXp;
    result.push({
      date: d.toISOString(),
      dailyXp,
      totalXp: cumulativeXp,
    });
  }

  return result;
}

export async function getWeeklyCompletions(userId: string) {
  const today = getTodayMidnight();
  const dayOfWeek = today.getDay(); // 0=Sun
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek); // Sunday

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const completions = await prisma.dailyCompletion.findMany({
    where: {
      userId,
      date: { gte: startOfWeek, lt: endOfWeek },
    },
    orderBy: { date: 'asc' },
  });

  // Build array for each day of the week (Sun-Sat)
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    const completion = completions.find((c) => {
      const cDate = new Date(c.date);
      cDate.setHours(0, 0, 0, 0);
      return cDate.getTime() === date.getTime();
    });
    return {
      date: date.toISOString(),
      dayIndex: i,
      amCompleted: completion?.amCompleted ?? false,
      pmCompleted: completion?.pmCompleted ?? false,
      customCompleted: completion?.customCompleted ?? false,
      moodLogged: completion?.moodLogged ?? false,
      isFullDay: completion?.isFullDay ?? false,
    };
  });

  return week;
}
